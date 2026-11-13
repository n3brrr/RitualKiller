import { useMemo } from "react";
import { BarChart3, Clock, Flame, Target, TrendingUp } from "lucide-react";
import type { Ritual, RitualLog } from "@/types";
import {
  buildWeekdaySeries,
  calculateCompletionRate,
  filterLogsByDays,
  isRitualCompleted,
} from "@/utils/analytics";
import { toDateKey } from "@/utils/dates";

interface ProductivityMetricsProps {
  rituals: Ritual[];
  logs: RitualLog[];
}

function percent(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)));
}

export function ProductivityMetrics({ rituals, logs }: ProductivityMetricsProps) {
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

    const weekday = buildWeekdaySeries(logs).reduce(
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
  }, [rituals, logs]);

  const cards = [
    {
      label: "Eficiencia hoy",
      value: `${percent(metrics.dailyEfficiency)}%`,
      detail: `${metrics.completionsToday} completados`,
      icon: <Target size={18} className="text-ritual-accent" aria-hidden="true" />,
    },
    {
      label: "Eficiencia semanal",
      value: `${percent(metrics.weeklyEfficiency)}%`,
      detail: "últimos 7 días",
      icon: <TrendingUp size={18} className="text-ritual-accent" aria-hidden="true" />,
    },
    {
      label: "Media 30 días",
      value: `${percent(metrics.averageCompletionRate)}%`,
      detail: "tasa de completitud",
      icon: <BarChart3 size={18} className="text-ritual-accent" aria-hidden="true" />,
    },
    {
      label: "Mejor día",
      value: metrics.bestDay,
      detail: "por completados",
      icon: <Clock size={18} className="text-ritual-accent" aria-hidden="true" />,
    },
    {
      label: "Completados",
      value: String(metrics.totalCompletions),
      detail: "en total",
      icon: <Flame size={18} className="text-ritual-accent" aria-hidden="true" />,
    },
    {
      label: "Mejor racha",
      value: String(metrics.bestStreak),
      detail: "días",
      icon: <Flame size={18} className="text-orange-500" aria-hidden="true" />,
    },
  ];

  return (
    <section aria-label="Métricas de productividad">
      <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-zinc-300">
        Productividad
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                {card.label}
              </span>
              {card.icon}
            </div>
            <div className="font-mono text-xl font-bold text-white">{card.value}</div>
            <div className="text-[10px] text-zinc-600">{card.detail}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ProductivityMetrics;
