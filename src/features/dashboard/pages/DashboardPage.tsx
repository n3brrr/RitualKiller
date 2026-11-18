import { Suspense, useMemo } from "react";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { AlertCircle, Check, CheckCircle2, Flame, Package, Zap } from "lucide-react";
import { Heatmap } from "@/components/Heatmap";
import Loading from "@/components/animations/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAuth } from "@/features/auth/useAuth";
import { useRituals } from "@/hooks/useRituals";
import { useI18n } from "@/i18n";
import { quoteKeyFor } from "@/data/quotes";
import { isCompletedIn } from "@/utils/analytics";
import { completionReasonKey } from "@/utils/ritualMessages";
import { errorMessage } from "@/lib/errors";
import { useToast } from "@/hooks/useToast";

const RitualCalendar = lazyWithRetry(
  () => import("@/components/calendar/RitualCalendar"),
);
const ProductivityMetrics = lazyWithRetry(
  () => import("@/components/productivity/ProductivityMetrics"),
);

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    rituals,
    logs,
    todayDate,
    completionIndex,
    isLoading,
    error,
    refetch,
    completeRitual,
    isPending,
  } = useRituals();
  const { t, tn } = useI18n();
  const toast = useToast();

  const quoteKey = useMemo(() => quoteKeyFor(), []);

  if (isLoading) return <Loading />;

  if (!user) return null;

  if (error) {
    return (
      <ErrorState
        title={t("dashboard.errorTitle")}
        message={errorMessage(error, t)}
        onRetry={() => void refetch()}
      />
    );
  }

  const pendingRituals = rituals.filter(
    (ritual) => !isCompletedIn(completionIndex, ritual, todayDate),
  );

  // Completing from the dashboard reports the reward (undo lives in Rituals).
  const handleComplete = async (ritualId: string) => {
    try {
      const result = await completeRitual(ritualId);
      if (result.success) {
        toast.show(t("habits.completedToast", { essence: result.essence_gained ?? 0 }), {
          tone: "success",
        });
      } else {
        toast.error(t(completionReasonKey(result.reason)));
      }
    } catch (completeError) {
      toast.error(errorMessage(completeError, t));
    }
  };
  const completedCount = rituals.length - pendingRituals.length;
  const bestStreak = Math.max(...rituals.map((ritual) => ritual.bestStreak), 0);

  return (
    <div className="space-y-6 animate-fade-in sm:space-y-8">
      <header className="flex flex-col gap-4 border-b border-zinc-900 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mb-2 font-display text-2xl font-bold text-white sm:text-3xl">
            {t("dashboard.title")}
          </h1>
          <p className="text-sm italic text-ritual-accent/80">"{t(quoteKey)}"</p>
        </div>
        <div className="text-left sm:text-right">
          <div className="flex items-center gap-2 font-display text-3xl font-bold text-zinc-200 sm:justify-end sm:text-4xl">
            {bestStreak}
            <Flame
              size={28}
              className={
                bestStreak > 0 ? "fill-orange-500/20 text-orange-500" : "text-zinc-700"
              }
              aria-hidden="true"
            />
          </div>
          <div className="text-xs uppercase tracking-widest text-zinc-400">
            {t("dashboard.bestStreak")}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t("dashboard.essence")} value={user.essence} accent />
        <Stat label={t("dashboard.active")} value={rituals.length} />
        <Stat label={t("dashboard.pending")} value={pendingRituals.length} />
        <Stat
          label={t("dashboard.inventory")}
          value={user.inventory.length}
          icon={<Package size={16} />}
        />
      </div>

      {rituals.length > 0 && (
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-4">
          <div className="mb-2 flex items-center justify-between gap-2 text-xs uppercase tracking-wider text-zinc-400">
            <span>{t("dashboard.todayProgress")}</span>
            <span className="font-mono text-ritual-accent">
              {t("dashboard.todayCount", {
                done: completedCount,
                total: rituals.length,
              })}
            </span>
          </div>
          <ProgressBar
            label={t("dashboard.todayProgress")}
            value={completedCount}
            max={rituals.length}
            className="h-2"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-zinc-900 bg-zinc-950/50 p-4 sm:p-6 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
            <Flame size={16} className="text-ritual-blood" aria-hidden="true" />
            {t("dashboard.consistency")}
          </h2>
          <Heatmap logs={logs} />
        </section>

        <section className="rounded-2xl border border-zinc-900 bg-zinc-950/50 p-4 sm:p-6">
          <Suspense fallback={<Loading />}>
            <RitualCalendar rituals={rituals} logs={logs} />
          </Suspense>
        </section>

        <section className="flex h-full flex-col rounded-2xl border border-zinc-900 bg-zinc-950/50 p-4 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
            <CheckCircle2 size={16} className="text-ritual-accent" aria-hidden="true" />
            {t("dashboard.pending")}
          </h2>

          <div className="flex-1 space-y-2">
            {rituals.length === 0 && (
              <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 p-4 text-center text-sm text-zinc-400">
                <AlertCircle size={24} className="mb-2" aria-hidden="true" />
                {t("dashboard.noRituals")}
              </div>
            )}

            {rituals.length > 0 && pendingRituals.length === 0 && (
              <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 p-4 text-center text-sm text-zinc-400">
                <Check size={24} className="mb-2 text-ritual-accent" aria-hidden="true" />
                {t("dashboard.allDone")}
              </div>
            )}

            {pendingRituals.map((ritual) => (
              <div
                key={ritual.id}
                className="flex items-center justify-between gap-2 rounded-r-lg border-l-2 border-zinc-800 bg-zinc-900/30 p-3 transition-colors hover:border-ritual-accent/50"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-zinc-200">
                    {ritual.title}
                  </div>
                  <div className="text-xs text-zinc-400">
                    +{ritual.essenceReward} {t("dashboard.essenceUnit")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleComplete(ritual.id)}
                  disabled={isPending(ritual.id)}
                  aria-busy={isPending(ritual.id)}
                  aria-label={`${t("dashboard.complete")} ${ritual.title}`}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 hover:border-ritual-accent hover:text-ritual-accent disabled:opacity-50"
                >
                  <Zap size={18} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          {completedCount > 0 && (
            <p className="mt-3 text-xs uppercase tracking-wider text-zinc-400">
              {tn("dashboard.completedTodayCount", completedCount)}
            </p>
          )}
        </section>
      </div>

      <Suspense fallback={<Loading />}>
        <ProductivityMetrics rituals={rituals} logs={logs} />
      </Suspense>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
  icon,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-4">
      <div className="mb-1 flex items-center justify-between gap-2 text-xs uppercase tracking-wider text-zinc-400">
        {label}
        {icon}
      </div>
      <div
        className={`font-mono text-xl sm:text-2xl ${accent ? "text-ritual-accent" : "text-white"}`}
      >
        {value}
      </div>
    </div>
  );
}
