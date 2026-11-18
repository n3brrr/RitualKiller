import { useState } from "react";
import { Archive, BookOpen, Check, Plus, RotateCcw, Sparkles, X } from "lucide-react";
import RitualCard from "@/components/rituals/RitualCard";
import RitualLibrary from "@/components/rituals/RitualLibrary";
import Loading from "@/components/animations/Loading";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAuth } from "@/features/auth/useAuth";
import { useRituals } from "@/hooks/useRituals";
import { useToast } from "@/hooks/useToast";
import { difficultyKeys, frequencyKeys, useI18n } from "@/i18n";
import { errorMessage } from "@/lib/errors";
import type { Difficulty, Frequency, Ritual } from "@/types";
import { templateText, type RitualTemplate } from "@/data/ritualLibrary";
import { ritualReward } from "@/utils/rewards";
import { isCompletedIn } from "@/utils/analytics";
import { completionReasonKey } from "@/utils/ritualMessages";
import { addDays, toDateKey } from "@/utils/dates";
import { validateRitual } from "@/utils/validation";

const DIFFICULTIES: Difficulty[] = ["novice", "adept", "master"];
const FREQUENCIES: Frequency[] = ["daily", "weekly"];

interface RitualForm {
  title: string;
  description: string;
  difficulty: Difficulty;
  frequency: Frequency;
}

const EMPTY_FORM: RitualForm = {
  title: "",
  description: "",
  difficulty: "novice",
  frequency: "daily",
};

export default function HabitsPage() {
  const { user } = useAuth();
  const {
    rituals,
    archivedRituals,
    todayDate,
    completionIndex,
    isLoading,
    error,
    refetch,
    createRitual,
    isCreating,
    updateRitual,
    isUpdating,
    archiveRitual,
    restoreRitual,
    completeRitual,
    completeYesterday,
    undoRitual,
    isPending,
  } = useRituals();
  const { t } = useI18n();
  const toast = useToast();

  const [showCreator, setShowCreator] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [editTarget, setEditTarget] = useState<Ritual | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ritual | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [form, setForm] = useState<RitualForm>(EMPTY_FORM);

  if (!user) return null;
  if (isLoading) return <Loading />;
  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState
          title={t("habits.errorTitle")}
          message={errorMessage(error, t)}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  // Master rituals require the Binding Contract (enforced again by the database);
  // an existing master ritual can keep its difficulty while being edited.
  const canUseMaster =
    user.isAdmin ||
    user.inventory.includes("binding_contract") ||
    editTarget?.difficulty === "master";
  const reward = ritualReward(form.difficulty, form.frequency);
  const existingTitles = new Set(rituals.map((ritual) => ritual.title.toLowerCase()));
  const isDone = (ritual: Ritual) => isCompletedIn(completionIndex, ritual, todayDate);
  const yesterdayKey = toDateKey(addDays(todayDate, -1));
  // Only daily rituals that already existed yesterday and have no log for it.
  // The server validates the date again (today or yesterday only).
  const canMarkYesterday = (ritual: Ritual) =>
    ritual.frequency === "daily" &&
    toDateKey(new Date(ritual.created_at)) <= yesterdayKey &&
    !completionIndex.get(ritual.id)?.has(yesterdayKey);
  const pending = rituals.filter((ritual) => !isDone(ritual));
  const completed = rituals.filter(isDone);

  const openCreator = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowCreator(true);
    setShowLibrary(false);
  };

  const openEditor = (ritual: Ritual) => {
    setEditTarget(ritual);
    setForm({
      title: ritual.title,
      description: ritual.description,
      difficulty: ritual.difficulty,
      frequency: ritual.frequency,
    });
    setShowCreator(true);
    setShowLibrary(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setShowCreator(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    const validation = validateRitual(form);
    if (!validation.valid) {
      setMessage(t(validation.messageKey ?? "habits.invalid"));
      return;
    }

    try {
      if (editTarget) {
        await updateRitual({ id: editTarget.id, input: form });
        toast.success(t("habits.updated"));
      } else {
        await createRitual(form);
      }
      closeForm();
    } catch (saveError) {
      setMessage(errorMessage(saveError, t));
    }
  };

  const handleImport = async (template: RitualTemplate) => {
    try {
      await createRitual({
        ...templateText(template, t),
        difficulty: template.difficulty,
        frequency: template.frequency,
      });
      toast.success(t("habits.added"));
    } catch (importError) {
      toast.error(errorMessage(importError, t));
    }
  };

  const handleToggle = async (ritual: Ritual) => {
    try {
      if (isDone(ritual)) {
        const result = await undoRitual(ritual.id);
        if (!result.success) toast.error(t(completionReasonKey(result.reason)));
      } else {
        const result = await completeRitual(ritual.id);
        if (result.success) {
          toast.success(
            t("habits.completedToast", { essence: result.essence_gained ?? 0 }),
          );
        } else {
          toast.error(t(completionReasonKey(result.reason)));
        }
      }
    } catch (toggleError) {
      toast.error(errorMessage(toggleError, t));
    }
  };

  const handleMarkYesterday = async (ritual: Ritual) => {
    try {
      const result = await completeYesterday(ritual.id);
      if (result.success) {
        toast.success(
          t("habits.yesterdayToast", { essence: result.essence_gained ?? 0 }),
        );
      } else {
        toast.error(t(completionReasonKey(result.reason)));
      }
    } catch (yesterdayError) {
      toast.error(errorMessage(yesterdayError, t));
    }
  };

  const handleRestore = async (ritual: Ritual) => {
    try {
      await restoreRitual(ritual.id);
      toast.success(t("habits.restored"));
    } catch (restoreError) {
      toast.error(errorMessage(restoreError, t));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await archiveRitual(deleteTarget.id);
    } catch (archiveError) {
      toast.error(errorMessage(archiveError, t));
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const listProps = {
    isDone,
    isPending,
    onToggle: (ritual: Ritual) => void handleToggle(ritual),
    onEdit: openEditor,
    canMarkYesterday,
    onMarkYesterday: (ritual: Ritual) => void handleMarkYesterday(ritual),
    onDelete: (id: string) =>
      setDeleteTarget(rituals.find((ritual) => ritual.id === id) ?? null),
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            {t("habits.title")}
          </h1>
          <p className="text-sm text-zinc-400">
            {t("habits.summary", {
              pending: pending.length,
              completed: completed.length,
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setShowLibrary((value) => !value);
              closeForm();
            }}
            aria-pressed={showLibrary}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-white transition-colors hover:bg-zinc-800 sm:flex-none"
          >
            <BookOpen size={16} aria-hidden="true" /> {t("habits.library")}
          </button>
          <button
            type="button"
            onClick={() => (showCreator ? closeForm() : openCreator())}
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

      {showLibrary && (
        <RitualLibrary onImport={handleImport} existingTitles={existingTitles} />
      )}

      {showCreator && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl sm:p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-white">
            {editTarget ? t("habits.editTitle") : t("habits.new")}
          </h2>
          {message && (
            <p
              role="alert"
              className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
            >
              {message}
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                    setForm({
                      ...form,
                      difficulty: event.target.value as Difficulty,
                    })
                  }
                  className="min-h-11 w-full rounded-lg border border-zinc-700 bg-black px-4 text-white outline-none focus:border-ritual-accent"
                >
                  {DIFFICULTIES.map((value) => {
                    const locked = value === "master" && !canUseMaster;
                    return (
                      <option key={value} value={value} disabled={locked}>
                        {t(difficultyKeys[value])}
                        {locked ? ` (${t("habits.masterLocked")})` : ""}
                      </option>
                    );
                  })}
                </select>
              </Field>

              <Field label={t("habits.frequency")}>
                <select
                  value={form.frequency}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      frequency: event.target.value as Frequency,
                    })
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
                disabled={isCreating || isUpdating}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ritual-accent px-5 font-bold text-black transition-colors hover:bg-emerald-400 disabled:opacity-50"
              >
                {isCreating || isUpdating
                  ? t("common.saving")
                  : editTarget
                    ? t("common.save")
                    : t("habits.create")}
              </button>
            </div>
          </form>
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
                onClick={openCreator}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-ritual-accent px-4 text-sm font-bold text-black transition-colors hover:bg-emerald-400"
              >
                <Plus size={16} aria-hidden="true" /> {t("habits.new")}
              </button>
            )}
          </div>
        }
        rituals={pending}
        icon={<Sparkles size={18} className="text-ritual-accent" aria-hidden="true" />}
        {...listProps}
      />

      {completed.length > 0 && (
        <RitualList
          title={t("habits.completed")}
          empty=""
          rituals={completed}
          icon={<Check size={18} aria-hidden="true" />}
          {...listProps}
        />
      )}

      {archivedRituals.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setShowArchived((open) => !open)}
            aria-expanded={showArchived}
            className="inline-flex min-h-11 items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <Archive size={16} aria-hidden="true" />
            {showArchived
              ? t("habits.hideArchived")
              : t("habits.showArchived", { count: archivedRituals.length })}
          </button>
          {showArchived && (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-zinc-400">{t("habits.archivedHint")}</p>
              <h2 className="sr-only">{t("habits.archivedTitle")}</h2>
              {archivedRituals.map((ritual) => (
                <div
                  key={ritual.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3"
                >
                  <span className="min-w-0 truncate text-zinc-300">{ritual.title}</span>
                  <button
                    type="button"
                    onClick={() => void handleRestore(ritual)}
                    aria-label={t("habits.restoreLabel", {
                      name: ritual.title,
                    })}
                    className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-zinc-700 px-3 text-sm text-zinc-300 transition-colors hover:border-ritual-accent hover:text-ritual-accent"
                  >
                    <RotateCcw size={16} aria-hidden="true" />
                    {t("habits.restore")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t("habits.deleteTitle")}
        description={t("habits.archivePrompt", {
          name: deleteTarget?.title ?? "",
        })}
        confirmLabel={t("habits.archive")}
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
  icon,
  isDone,
  isPending,
  onToggle,
  onEdit,
  onDelete,
  canMarkYesterday,
  onMarkYesterday,
}: {
  title: string;
  empty: React.ReactNode;
  rituals: Ritual[];
  icon: React.ReactNode;
  isDone: (ritual: Ritual) => boolean;
  isPending: (id: string) => boolean;
  onToggle: (ritual: Ritual) => void;
  onEdit: (ritual: Ritual) => void;
  onDelete: (id: string) => void;
  canMarkYesterday: (ritual: Ritual) => boolean;
  onMarkYesterday: (ritual: Ritual) => void;
}) {
  return (
    <section>
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
            isDone={isDone(ritual)}
            busy={isPending(ritual.id)}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            canMarkYesterday={canMarkYesterday(ritual)}
            onMarkYesterday={onMarkYesterday}
          />
        ))}
      </div>
    </section>
  );
}
