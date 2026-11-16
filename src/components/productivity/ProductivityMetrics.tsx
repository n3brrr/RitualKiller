import { useMemo } from "react";
import { BarChart3, Clock, Flame, Target, TrendingUp } from "lucide-react";
import type { Ritual, RitualLog } from "@/types";
import {
  buildWeekdaySeries,
  calculateCompletionRate,
  filterLogsByDays,
  isRitualCompleted,
} from "@/utils/analytics";
import { useI18n } from "@/i18n";
import { toDateKey } from "@/utils/dates";

interface ProductivityMetricsProps {
  rituals: Ritual[];
  logs: RitualLog[];
}

function percent(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)));
}

export function ProductivityMetrics({ rituals, logs }: ProductivityMetricsProps) {
  const { t, locale } = useI18n();
  const metrics = useMemo(() => {
    const todayKey = toDateKey();
    const completedToday = rituals.filter((ritual) =>
      isRitualCompleted(ritual, logs, new Date()),
    ).length;
    const dailyEfficiency = rituals.length > 0 ? (completedToday / rituals.length) * 100 : 0;
    const weeklyLogs = filterLogsByDays(logs, 7);
    const weeklyEfficiency =
      rituals.length > 0 ? (weeklyLogs.length / (rituals.length * 7)) * 100 : 0;
    const last30 = filterLogsByDays(logs, 30);
    const averageCompletionRate = calculateCompletionRate(rituals, last30, 30);

    const weekday = buildWeekdaySeries(logs, locale).reduce(
      (best, item) => (item.Completions > best.Completions ? item : best),
      { name: "—", Completions: 0 },
    );

    const completionsToday = logs.filter((log) => log.date.slice(0, 10) === todayKey).length;
    const bestStreak = Math.max(...rituals.map((ritual) => ritual.streak), 0);

    return {
      dailyEfficiency,
      weeklyEfficiency,
      averageCompletionRate,
      bestDay: weekday.Completions > 0 ? weekday.name : "—",
      completionsToday,
      totalCompletions: logs.length,
      bestStreak,
    };
  }, [rituals, logs, locale]);

  const cards = [
    {
      label: t("productivity.today"),
      value: `${percent(metrics.dailyEfficiency)}%`,
      detail: `${metrics.completionsToday} ${t("productivity.completed")}`,
      icon: <Target size={18} className="text-ritual-accent" aria-hidden="true" />,
    },
    {
      label: t("productivity.weekly"),
      value: `${percent(metrics.weeklyEfficiency)}%`,
      detail: t("productivity.last7"),
      icon: <TrendingUp size={18} className="text-ritual-accent" aria-hidden="true" />,
    },
    {
      label: t("productivity.average30"),
      value: `${percent(metrics.averageCompletionRate)}%`,
      detail: t("productivity.completionRate"),
      icon: <BarChart3 size={18} className="text-ritual-accent" aria-hidden="true" />,
    },
    {
      label: t("productivity.bestDay"),
      value: metrics.bestDay,
      detail: t("productivity.byCompletions"),
      icon: <Clock size={18} className="text-ritual-accent" aria-hidden="true" />,
    },
    {
      label: t("productivity.completedTotal"),
      value: String(metrics.totalCompletions),
      detail: t("productivity.inTotal"),
      icon: <Flame size={18} className="text-ritual-accent" aria-hidden="true" />,
    },
    {
      label: t("productivity.bestStreak"),
      value: String(metrics.bestStreak),
      detail: t("productivity.days"),
      icon: <Flame size={18} className="text-orange-500" aria-hidden="true" />,
    },
  ];

  return (
    <section aria-label={t("productivity.label")}>
      <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-zinc-300">
        {t("productivity.title")}
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs uppercase tracking-wider text-zinc-400">
                {card.label}
              </span>
              {card.icon}
            </div>
            <div className="font-mono text-xl font-bold text-white">{card.value}</div>
            <div className="text-xs text-zinc-400">{card.detail}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ProductivityMetrics;
