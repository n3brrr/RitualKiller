import type { Ritual } from "@/types";
import { Check, Trash2, Zap } from "lucide-react";
import { translateDifficulty, translateFrequency } from "@/utils/translations";

interface RitualCardProps {
  ritual: Ritual;
  isDone: boolean;
  busy?: boolean;
  onToggle: (ritual: Ritual) => void;
  onDelete: (id: string) => void;
}

const DIFFICULTY_STYLES = {
  novice: "border-green-900/60 text-green-500",
  adept: "border-yellow-900/60 text-yellow-500",
  master: "border-red-900/60 text-red-500",
} as const;

export function RitualCard({ ritual, isDone, busy = false, onToggle, onDelete }: RitualCardProps) {
  return (
    <article
      className={`relative flex items-start justify-between gap-3 rounded-xl border p-4 transition-colors sm:p-5 ${
        isDone
          ? "border-ritual-accent/30 bg-ritual-accent/5"
          : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={`text-base font-bold sm:text-lg ${
              isDone ? "text-ritual-accent line-through opacity-70" : "text-zinc-100"
            }`}
          >
            {ritual.title}
          </h3>
          {ritual.streak > 1 && (
            <span className="inline-flex items-center gap-1 rounded border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 font-mono text-[10px] text-yellow-500">
              <Zap size={10} fill="currentColor" aria-hidden="true" />
              {ritual.streak}
            </span>
          )}
        </div>

        {ritual.description && (
          <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{ritual.description}</p>
        )}

        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] uppercase tracking-wider">
          <span className={`rounded border px-2 py-0.5 ${DIFFICULTY_STYLES[ritual.difficulty]}`}>
            {translateDifficulty(ritual.difficulty)}
          </span>
          <span className="rounded border border-zinc-800 px-2 py-0.5 text-zinc-400">
            {translateFrequency(ritual.frequency)}
          </span>
          <span className="rounded border border-zinc-800 px-2 py-0.5 text-zinc-400">
            +{ritual.essenceReward} essence
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onToggle(ritual)}
          disabled={busy}
          aria-label={isDone ? `Desmarcar ${ritual.title}` : `Completar ${ritual.title}`}
          aria-pressed={isDone}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors disabled:cursor-wait disabled:opacity-60 ${
            isDone
              ? "border-ritual-accent bg-ritual-accent text-black"
              : "border-zinc-700 text-zinc-600 hover:border-ritual-accent hover:text-ritual-accent"
          }`}
        >
          <Check size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(ritual.id)}
          aria-label={`Eliminar ${ritual.title}`}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-zinc-600 transition-colors hover:text-red-500"
        >
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

export default RitualCard;
