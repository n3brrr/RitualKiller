import { useMemo } from "react";
import type { RitualLog } from "@/types";
import { useI18n } from "@/i18n";
import { lastNDays } from "@/utils/dates";

const INTENSITY = [
  "bg-zinc-900",
  "bg-ritual-accent/20",
  "bg-ritual-accent/40",
  "bg-ritual-accent/70",
  "bg-ritual-accent",
] as const;

export function Heatmap({ logs }: { logs: RitualLog[] }) {
  const { t, tn } = useI18n();
  const cells = useMemo(() => {
    const counts = new Map<string, number>();
    for (const log of logs) {
      const date = log.date.slice(0, 10);
      counts.set(date, (counts.get(date) ?? 0) + 1);
    }

    return lastNDays(364).map((date) => ({
      date,
      count: counts.get(date) ?? 0,
    }));
  }, [logs]);

  const max = Math.max(1, ...cells.map((cell) => cell.count));

  return (
    <div className="space-y-3">
      <div
        className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1"
        role="img"
        aria-label={t("heatmap.label")}
      >
        {cells.map((cell) => {
          const level =
            cell.count === 0 ? 0 : Math.min(4, Math.ceil((cell.count / max) * 4));
          return (
            <span
              key={cell.date}
              title={tn("heatmap.cell", cell.count, { date: cell.date })}
              className={`h-2.5 w-2.5 rounded-sm sm:h-3 sm:w-3 ${INTENSITY[level]}`}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-end gap-1 text-xs uppercase tracking-wider text-zinc-400">
        <span>{t("heatmap.less")}</span>
        {INTENSITY.map((className, index) => (
          <span key={index} className={`h-2.5 w-2.5 rounded-sm ${className}`} />
        ))}
        <span>{t("heatmap.more")}</span>
      </div>
    </div>
  );
}
