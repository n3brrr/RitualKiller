import { useMemo, useState } from "react";
import { BookOpen, Plus, Search, Star } from "lucide-react";
import {
  getPopularRituals,
  RITUAL_LIBRARY,
  searchRituals,
  type RitualCategory,
  type RitualTemplate,
} from "@/data/ritualLibrary";
import type { Difficulty } from "@/types";
import { difficultyKeys, frequencyKeys, useI18n, type TranslationKey } from "@/i18n";

interface RitualLibraryProps {
  onImport: (template: RitualTemplate) => Promise<void> | void;
}

const CATEGORIES: Array<{ value: RitualCategory; labelKey: TranslationKey }> = [
  { value: "health", labelKey: "library.category.health" },
  { value: "productivity", labelKey: "library.category.productivity" },
  { value: "mental", labelKey: "library.category.mental" },
  { value: "physical", labelKey: "library.category.physical" },
  { value: "learning", labelKey: "library.category.learning" },
  { value: "creativity", labelKey: "library.category.creativity" },
  { value: "social", labelKey: "library.category.social" },
  { value: "spiritual", labelKey: "library.category.spiritual" },
];

const DIFFICULTIES: Difficulty[] = ["novice", "adept", "master"];

const DIFFICULTY_STYLES = {
  novice: "border-green-500/30 bg-green-500/10 text-green-500",
  adept: "border-yellow-500/30 bg-yellow-500/10 text-yellow-500",
  master: "border-red-500/30 bg-red-500/10 text-red-500",
} as const;

export function RitualLibrary({ onImport }: RitualLibraryProps) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<RitualCategory | "all">("all");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [popularOnly, setPopularOnly] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = searchQuery.trim()
      ? searchRituals(searchQuery)
      : popularOnly
        ? getPopularRituals()
        : RITUAL_LIBRARY;

    if (category !== "all") list = list.filter((item) => item.category === category);
    if (difficulty !== "all")
      list = list.filter((item) => item.difficulty === difficulty);
    return list;
  }, [searchQuery, category, difficulty, popularOnly]);

  const handleImport = async (template: RitualTemplate) => {
    setImportingId(template.id);
    try {
      await onImport(template);
    } finally {
      setImportingId(null);
    }
  };

  return (
    <section className="space-y-4" aria-label={t("library.label")}>
      <div className="flex items-center gap-2">
        <BookOpen className="text-ritual-accent" size={22} aria-hidden="true" />
        <h2 className="font-display text-xl font-bold">{t("library.title")}</h2>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            size={18}
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t("library.searchPlaceholder")}
            aria-label={t("library.searchLabel")}
            className="min-h-11 w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-10 pr-4 text-white placeholder-zinc-500 outline-none focus:border-ritual-accent"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPopularOnly((value) => !value)}
            aria-pressed={popularOnly}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-xs uppercase tracking-wider ${
              popularOnly
                ? "border-ritual-accent bg-ritual-accent/10 text-ritual-accent"
                : "border-zinc-800 bg-zinc-900 text-zinc-400"
            }`}
          >
            <Star size={14} aria-hidden="true" /> {t("library.popular")}
          </button>

          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as RitualCategory | "all")
            }
            aria-label={t("library.categoryLabel")}
            className="min-h-11 flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-ritual-accent"
          >
            <option value="all">{t("library.categoryAll")}</option>
            {CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {t(item.labelKey)}
              </option>
            ))}
          </select>

          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as Difficulty | "all")}
            aria-label={t("library.difficultyLabel")}
            className="min-h-11 flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-white outline-none focus:border-ritual-accent"
          >
            <option value="all">{t("library.difficultyAll")}</option>
            {DIFFICULTIES.map((value) => (
              <option key={value} value={value}>
                {t(difficultyKeys[value])}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filtered.map((template) => (
          <article
            key={template.id}
            className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950 p-4 transition-colors hover:border-zinc-700"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="font-bold text-white">{template.title}</h3>
              {template.popular && (
                <Star
                  className="shrink-0 fill-yellow-500/20 text-yellow-500"
                  size={16}
                  aria-label={t("library.popularMark")}
                />
              )}
            </div>
            <p className="mb-3 flex-1 text-sm text-zinc-400">{template.description}</p>

            <div className="mb-3 flex flex-wrap gap-1.5 text-xs uppercase tracking-wider">
              <span
                className={`rounded border px-2 py-0.5 ${DIFFICULTY_STYLES[template.difficulty]}`}
              >
                {t(difficultyKeys[template.difficulty])}
              </span>
              <span className="rounded border border-zinc-800 px-2 py-0.5 text-zinc-400">
                {t(frequencyKeys[template.frequency])}
              </span>
              <span className="rounded border border-ritual-accent/30 px-2 py-0.5 text-ritual-accent">
                +{template.essenceReward}
              </span>
            </div>

            <button
              type="button"
              onClick={() => void handleImport(template)}
              disabled={importingId === template.id}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ritual-accent px-4 text-sm font-bold text-black transition-colors hover:bg-emerald-400 disabled:opacity-50"
            >
              <Plus size={16} aria-hidden="true" />
              {importingId === template.id ? t("library.adding") : t("library.add")}
            </button>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-zinc-400">{t("library.empty")}</p>
      )}
    </section>
  );
}

export default RitualLibrary;
