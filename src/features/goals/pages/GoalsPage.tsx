import { useState } from "react";
import { AlertCircle, Calendar, Plus, Target, Trash2 } from "lucide-react";
import { useGoals } from "@/hooks/useGoals";
import { useRituals } from "@/hooks/useRituals";
import { useI18n } from "@/i18n";
import { addDays, daysUntil, toDateKey } from "@/utils/dates";
import Loading from "@/components/animations/Loading";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function GoalsPage() {
  const { goals, isLoading, error, refetch, createGoal, isCreating, removeGoal } = useGoals();
  const { rituals, logs } = useRituals();
  const { t, locale } = useI18n();

  const [showCreator, setShowCreator] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    targetDate: toDateKey(addDays(new Date(), 30)),
    targetValue: 30,
    ritualIds: [] as string[],
  });

  if (isLoading) return <Loading />;
  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center"
        >
          <AlertCircle className="mx-auto mb-2 text-red-500" size={24} aria-hidden="true" />
          <h1 className="font-display text-lg font-bold text-white">
            {t("goals.errorTitle")}
          </h1>
          <p className="mt-1 text-sm text-red-400">{error.message}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-zinc-700 px-4 text-sm text-zinc-200 transition-colors hover:border-ritual-accent hover:text-ritual-accent"
          >
            {t("common.retry")}
          </button>
        </div>
      </div>
    );
  }

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (form.title.trim().length < 2) {
      setFormError(t("goals.titleRequired"));
      return;
    }
    if (!form.targetDate) {
      setFormError(t("goals.dateRequired"));
      return;
    }

    try {
      await createGoal({
        title: form.title,
        description: form.description,
        targetDate: form.targetDate,
        targetValue: Math.max(1, form.targetValue),
        ritualIds: form.ritualIds,
      });
      setForm({
        title: "",
        description: "",
        targetDate: toDateKey(addDays(new Date(), 30)),
        targetValue: 30,
        ritualIds: [],
      });
      setShowCreator(false);
    } catch (createError) {
      setFormError(createError instanceof Error ? createError.message : t("goals.createError"));
    }
  };

  const toggleRitual = (id: string) => {
    setForm((current) => ({
      ...current,
      ritualIds: current.ritualIds.includes(id)
        ? current.ritualIds.filter((item) => item !== id)
        : [...current.ritualIds, id],
    }));
  };

  const progressFor = (goal: (typeof goals)[number]) => {
    const relevant =
      goal.ritual_ids.length > 0
        ? logs.filter((log) => goal.ritual_ids.includes(log.ritualId))
        : logs;
    return Math.min(relevant.length, goal.target_value);
  };

  const handleDelete = (id: string, title: string) => {
    setDeleteTarget({ id, title });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setFormError(null);
    setDeleting(true);
    try {
      await removeGoal(deleteTarget.id);
    } catch (deleteError) {
      setFormError(deleteError instanceof Error ? deleteError.message : t("goals.deleteError"));
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{t("goals.title")}</h1>
          <p className="text-sm text-zinc-400">{t("goals.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreator((value) => !value)}
          aria-expanded={showCreator}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ritual-accent px-4 font-bold text-black hover:bg-emerald-400"
        >
          <Plus size={16} aria-hidden="true" />
          {showCreator ? t("common.close") : t("goals.new")}
        </button>
      </header>

      {formError && (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {formError}
        </p>
      )}

      {showCreator && (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6"
        >
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-400">
              {t("goals.titleLabel")}
            </span>
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              maxLength={120}
              required
              className="min-h-11 w-full rounded-lg border border-zinc-700 bg-black px-4 text-white outline-none focus:border-ritual-accent"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-400">
              {t("goals.description")}
            </span>
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              maxLength={500}
              rows={2}
              className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-2 text-white outline-none focus:border-ritual-accent"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                {t("goals.targetDate")}
              </span>
              <input
                type="date"
                value={form.targetDate}
                min={toDateKey()}
                onChange={(event) => setForm({ ...form, targetDate: event.target.value })}
                required
                className="min-h-11 w-full rounded-lg border border-zinc-700 bg-black px-4 text-white outline-none focus:border-ritual-accent"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                {t("goals.targetValue")}
              </span>
              <input
                type="number"
                min={1}
                max={10000}
                value={form.targetValue}
                onChange={(event) =>
                  setForm({ ...form, targetValue: Math.max(1, Number(event.target.value)) })
                }
                className="min-h-11 w-full rounded-lg border border-zinc-700 bg-black px-4 text-white outline-none focus:border-ritual-accent"
              />
            </label>
          </div>

          <fieldset>
            <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
              {t("goals.linked")}
            </legend>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-zinc-800 p-2">
              {rituals.length === 0 && (
                <p className="p-2 text-sm text-zinc-400">{t("goals.noRituals")}</p>
              )}
              {rituals.map((ritual) => (
                <label
                  key={ritual.id}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-zinc-900"
                >
                  <input
                    type="checkbox"
                    checked={form.ritualIds.includes(ritual.id)}
                    onChange={() => toggleRitual(ritual.id)}
                    className="h-4 w-4 accent-ritual-accent"
                  />
                  <span className="text-sm text-zinc-300">{ritual.title}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={isCreating}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-ritual-accent px-5 font-bold text-black hover:bg-emerald-400 disabled:opacity-50 sm:w-auto"
          >
            {isCreating ? t("common.saving") : t("common.create")}
          </button>
        </form>
      )}

      {goals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-400">
          <Target className="mx-auto mb-3 text-ritual-accent/60" size={28} aria-hidden="true" />
          <p>{t("goals.empty")}</p>
          {!showCreator && (
            <button
              type="button"
              onClick={() => setShowCreator(true)}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-ritual-accent px-4 text-sm font-bold text-black transition-colors hover:bg-emerald-400"
            >
              <Plus size={16} aria-hidden="true" /> {t("goals.new")}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {goals.map((goal) => {
            const progress = progressFor(goal);
            const percent = Math.min(100, Math.round((progress / goal.target_value) * 100));
            const remaining = daysUntil(goal.target_date);
            const targetDate = new Date(`${goal.target_date}T00:00:00`).toLocaleDateString(
              locale,
              { day: "numeric", month: "short", year: "numeric" },
            );

            return (
              <article key={goal.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-bold text-white">{goal.title}</h2>
                    {goal.description && (
                      <p className="mt-1 text-sm text-zinc-400">{goal.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(goal.id, goal.title)}
                    aria-label={`${t("common.delete")} ${goal.title}`}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:text-red-500"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>

                <div className="mb-1 flex justify-between text-xs text-zinc-400">
                  <span>
                    {progress} / {goal.target_value}
                  </span>
                  <span>{percent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-900">
                  <div className="h-full bg-ritual-accent" style={{ width: `${percent}%` }} />
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-wider text-zinc-400">
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={12} aria-hidden="true" /> {targetDate}
                  </span>
                  <span className={remaining < 0 ? "text-red-400" : ""}>
                    {remaining >= 0
                      ? `${remaining} ${t("goals.remaining")}`
                      : `${Math.abs(remaining)} ${t("goals.overdueDays")}`}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Target size={12} aria-hidden="true" /> {goal.ritual_ids.length}{" "}
                    {t("goals.linkedCount")}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t("goals.deleteTitle")}
        description={
          <>
            {t("goals.deletePrompt")}{" "}
            <strong className="text-zinc-200">{deleteTarget?.title}</strong>
            {t("goals.deleteSuffix")}
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
