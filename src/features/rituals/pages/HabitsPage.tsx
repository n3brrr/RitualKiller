import { useState } from "react";
import { BookOpen, Check, PenTool, Plus, Sparkles, X } from "lucide-react";
import RitualCard from "@/components/rituals/RitualCard";
import RitualLibrary from "@/components/rituals/RitualLibrary";
import Loading from "@/components/animations/Loading";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAuth } from "@/features/auth/AuthProvider";
import { useRituals } from "@/hooks/useRituals";
import { difficultyKeys, frequencyKeys, useI18n } from "@/i18n";
import { generateRitualSuggestions } from "@/services/ai/ollamaService";
import type { Difficulty, Frequency, Ritual } from "@/types";
import type { RitualTemplate } from "@/data/ritualLibrary";
import { isRitualCompleted } from "@/utils/analytics";
import { toDateKey } from "@/utils/dates";
import { validateRitual } from "@/utils/validation";

type CreateMode = "manual" | "ai";

const BASE_REWARD: Record<Difficulty, number> = { novice: 10, adept: 25, master: 50 };
const DIFFICULTIES: Difficulty[] = ["novice", "adept", "master"];
const FREQUENCIES: Frequency[] = ["daily", "weekly"];

export default function HabitsPage() {
  const { user } = useAuth();
  const {
    rituals,
    logs,
    isLoading,
    error,
    refetch,
    createRitual,
    isCreating,
    removeRitual,
    completeRitual,
    undoRitual,
    isToggling,
  } = useRituals();
  const { t } = useI18n();

  const [showCreator, setShowCreator] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [mode, setMode] = useState<CreateMode>("manual");
  const [goalInput, setGoalInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ritual | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    difficulty: "novice" as Difficulty,
    frequency: "daily" as Frequency,
  });

  if (!user) return null;
  if (isLoading) return <Loading />;
  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState
          title={t("habits.errorTitle")}
          message={error.message}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const todayKey = toDateKey();
  const reward = BASE_REWARD[form.difficulty] * (form.frequency === "weekly" ? 3 : 1);
  const pending = rituals.filter(
    (ritual) => !isRitualCompleted(ritual, logs, new Date()),
  );
  const completed = rituals.filter((ritual) =>
    isRitualCompleted(ritual, logs, new Date()),
  );

  const handleError = (error: unknown) => {
    setMessage(error instanceof Error ? error.message : t("common.error"));
  };

  const handleManualCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    const validation = validateRitual(form);
    if (!validation.valid) {
      setMessage(validation.messageKey ? t(validation.messageKey) : t("habits.invalid"));
      return;
    }

    try {
      await createRitual({
        title: form.title,
        description: form.description,
        difficulty: form.difficulty,
        frequency: form.frequency,
        essenceReward: reward,
      });
      setForm({ title: "", description: "", difficulty: "novice", frequency: "daily" });
      setShowCreator(false);
    } catch (error) {
      handleError(error);
    }
  };

  const handleAiCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    if (!goalInput.trim()) return;

    setIsGenerating(true);
    try {
      const suggestions = await generateRitualSuggestions(goalInput);
      for (const suggestion of suggestions) {
        await createRitual({
          title: suggestion.title,
          description: suggestion.description,
          difficulty: suggestion.difficulty,
          frequency: "daily",
          essenceReward: BASE_REWARD[suggestion.difficulty],
        });
      }
      setGoalInput("");
      setShowCreator(false);
    } catch (error) {
      handleError(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImport = async (template: RitualTemplate) => {
    setMessage(null);
    try {
      await createRitual({
        title: template.title,
        description: template.description,
        difficulty: template.difficulty,
        frequency: template.frequency,
        essenceReward: template.essenceReward,
      });
    } catch (error) {
      handleError(error);
    }
  };

  const handleToggle = async (ritual: Ritual) => {
    setMessage(null);
    try {
      if (isRitualCompleted(ritual, logs, new Date())) {
        await undoRitual({ id: ritual.id, date: todayKey });
      } else {
        await completeRitual({ id: ritual.id, date: todayKey });
      }
    } catch (error) {
      handleError(error);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteTarget(rituals.find((ritual) => ritual.id === id) ?? null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setMessage(null);
    setDeleting(true);
    try {
      await removeRitual(deleteTarget.id);
    } catch (error) {
      handleError(error);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            {t("habits.title")}
          </h1>
          <p className="text-sm text-zinc-400">
            {pending.length} {t("habits.pendingCount")} · {completed.length}{" "}
            {t("habits.completedCount")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setShowLibrary((value) => !value);
              setShowCreator(false);
            }}
            aria-pressed={showLibrary}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-white transition-colors hover:bg-zinc-800 sm:flex-none"
          >
            <BookOpen size={16} aria-hidden="true" /> {t("habits.library")}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCreator((value) => !value);
              setShowLibrary(false);
            }}
            aria-expanded={showCreator}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-ritual-accent px-3 text-sm font-bold text-black transition-colors hover:bg-emerald-400 sm:flex-none"
          >
            {showCreator ? (
              <X size={16} aria-hidden="true" />
            ) : (
              <Plus size={16} aria-hidden="true" />
            )}
            {showCreator ? t("common.close") : t("habits.new")}
          </button>
        </div>
      </header>

      {message && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
        >
          {message}
        </p>
      )}

      {showLibrary && <RitualLibrary onImport={handleImport} />}

      {showCreator && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl sm:p-6">
          <div className="mb-5 flex gap-4 border-b border-zinc-800 pb-3">
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={`flex min-h-11 items-center gap-2 border-b-2 text-xs font-bold uppercase tracking-wider ${
                mode === "manual"
                  ? "border-ritual-accent text-ritual-accent"
                  : "border-transparent text-zinc-400"
              }`}
            >
              <PenTool size={14} aria-hidden="true" /> {t("habits.manual")}
            </button>
            <button
              type="button"
              onClick={() => setMode("ai")}
              className={`flex min-h-11 items-center gap-2 border-b-2 text-xs font-bold uppercase tracking-wider ${
                mode === "ai"
                  ? "border-ritual-accent text-ritual-accent"
                  : "border-transparent text-zinc-400"
              }`}
            >
              <Sparkles size={14} aria-hidden="true" /> {t("habits.ai")}
            </button>
          </div>

          {mode === "manual" ? (
            <form onSubmit={handleManualCreate} className="space-y-4">
              <Field label={t("habits.titleLabel")}>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  maxLength={100}
                  required
                  placeholder={t("habits.titlePlaceholder")}
                  className="min-h-11 w-full rounded-lg border border-zinc-700 bg-black px-4 text-white outline-none focus:border-ritual-accent"
                />
              </Field>

              <Field label={t("habits.description")}>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  maxLength={500}
                  rows={2}
                  placeholder={t("habits.descriptionPlaceholder")}
                  className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-2 text-white outline-none focus:border-ritual-accent"
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t("habits.difficulty")}>
                  <select
                    value={form.difficulty}
                    onChange={(event) =>
                      setForm({ ...form, difficulty: event.target.value as Difficulty })
                    }
                    className="min-h-11 w-full rounded-lg border border-zinc-700 bg-black px-4 text-white outline-none focus:border-ritual-accent"
                  >
                    {DIFFICULTIES.map((value) => (
                      <option key={value} value={value}>
                        {t(difficultyKeys[value])}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label={t("habits.frequency")}>
                  <select
                    value={form.frequency}
                    onChange={(event) =>
                      setForm({ ...form, frequency: event.target.value as Frequency })
                    }
                    className="min-h-11 w-full rounded-lg border border-zinc-700 bg-black px-4 text-white outline-none focus:border-ritual-accent"
                  >
                    {FREQUENCIES.map((value) => (
                      <option key={value} value={value}>
                        {t(frequencyKeys[value])}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-zinc-800 pt-3">
                <span className="text-sm text-zinc-400">
                  {t("habits.reward")}:{" "}
                  <strong className="font-mono text-ritual-accent">+{reward}</strong>
                </span>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ritual-accent px-5 font-bold text-black transition-colors hover:bg-emerald-400 disabled:opacity-50"
                >
                  {isCreating ? t("common.saving") : t("habits.create")}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAiCreate} className="space-y-3">
              <p className="text-sm text-zinc-400">{t("habits.aiHelp")}</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={goalInput}
                  onChange={(event) => setGoalInput(event.target.value)}
                  maxLength={200}
                  required
                  placeholder={t("habits.goalPlaceholder")}
                  className="min-h-11 flex-1 rounded-lg border border-zinc-700 bg-black px-4 text-white outline-none focus:border-ritual-accent"
                />
                <button
                  type="submit"
                  disabled={isGenerating || isCreating}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ritual-accent px-5 font-bold text-black transition-colors hover:bg-emerald-400 disabled:opacity-50"
                >
                  {isGenerating ? t("habits.invoking") : t("habits.invoke")}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      <RitualList
        title={t("habits.pending")}
        empty={
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {rituals.length === 0 ? t("habits.emptyGrimoire") : t("habits.empty")}
            </span>
            {rituals.length === 0 && !showCreator && (
              <button
                type="button"
                onClick={() => {
                  setShowCreator(true);
                  setShowLibrary(false);
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-ritual-accent px-4 text-sm font-bold text-black transition-colors hover:bg-emerald-400"
              >
                <Plus size={16} aria-hidden="true" /> {t("habits.new")}
              </button>
            )}
          </div>
        }
        rituals={pending}
        logs={logs}
        onToggle={handleToggle}
        onDelete={handleDelete}
        busy={isToggling}
        icon={<Sparkles size={18} className="text-ritual-accent" aria-hidden="true" />}
      />

      {completed.length > 0 && (
        <RitualList
          title={t("habits.completed")}
          empty=""
          rituals={completed}
          logs={logs}
          onToggle={handleToggle}
          onDelete={handleDelete}
          busy={isToggling}
          icon={<Check size={18} aria-hidden="true" />}
          muted
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t("habits.deleteTitle")}
        description={
          <>
            {t("habits.deletePrompt")}{" "}
            <strong className="text-zinc-200">{deleteTarget?.title}</strong>{" "}
            {t("habits.deleteSuffix")}
          </>
        }
        confirmLabel={t("common.delete")}
        destructive
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function RitualList({
  title,
  empty,
  rituals,
  logs,
  onToggle,
  onDelete,
  busy,
  icon,
  muted = false,
}: {
  title: string;
  empty: React.ReactNode;
  rituals: Ritual[];
  logs: Parameters<typeof isRitualCompleted>[1];
  onToggle: (ritual: Ritual) => void;
  onDelete: (id: string) => void;
  busy: boolean;
  icon: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <section className={muted ? "opacity-70 transition-opacity hover:opacity-100" : ""}>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
        {icon}
        {title}
      </h2>
      <div className="space-y-2">
        {rituals.length === 0 && empty && (
          <div className="rounded-xl border border-dashed border-zinc-800 p-4 text-sm text-zinc-400">
            {empty}
          </div>
        )}
        {rituals.map((ritual) => (
          <RitualCard
            key={ritual.id}
            ritual={ritual}
            isDone={isRitualCompleted(ritual, logs, new Date())}
            busy={busy}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}
