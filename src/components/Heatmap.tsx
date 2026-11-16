import { useMemo } from "react";
import type { RitualLog } from "@/types";
import { useI18n } from "@/i18n";
import { addDays, toDateKey } from "@/utils/dates";

const INTENSITY = [
  "bg-zinc-900",
  "bg-ritual-accent/20",
  "bg-ritual-accent/40",
  "bg-ritual-accent/70",
  "bg-ritual-accent",
] as const;

const WEEKS = 52;

/**
 * Last 52 weeks, one column per Monday-based week and one row per weekday
 * (Monday on top), so rows really are weekdays. Screen readers get a text
 * summary instead of 364 unlabeled squares.
 */
export function Heatmap({ logs }: { logs: RitualLog[] }) {
  const { t, tn, locale } = useI18n();

  const { cells, total, activeDays } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const log of logs) {
      const date = log.date.slice(0, 10);
      counts.set(date, (counts.get(date) ?? 0) + 1);
    }

    const today = new Date();
    const monday = addDays(today, -((today.getDay() + 6) % 7));
    const start = addDays(monday, -(WEEKS - 1) * 7);
    const todayKey = toDateKey(today);
    const result: Array<{ date: string; count: number; future: boolean }> = [];
    let sum = 0;
    let active = 0;
    for (let index = 0; index < WEEKS * 7; index += 1) {
      const date = toDateKey(addDays(start, index));
      const count = counts.get(date) ?? 0;
      const future = date > todayKey;
      if (!future) {
        sum += count;
        if (count > 0) active += 1;
      }
      result.push({ date, count, future });
    }
    return { cells: result, total: sum, activeDays: active };
  }, [logs]);

  const max = Math.max(1, ...cells.map((cell) => cell.count));
  const weekdayLabels = Array.from({ length: 7 }, (_, index) =>
    new Date(2024, 0, 1 + index).toLocaleDateString(locale, { weekday: "short" }),
  );

  return (
    <div className="space-y-3">
      <p className="sr-only">{t("heatmap.summary", { total, days: activeDays })}</p>
      <div className="flex gap-1" aria-hidden="true">
        <div className="grid grid-rows-7 gap-1 pr-1 text-[10px] leading-none text-zinc-400">
          {weekdayLabels.map((label, index) => (
            <span key={label} className="flex h-2.5 items-center sm:h-3">
              {index % 2 === 0 ? label : ""}
            </span>
          ))}
        </div>
        <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1">
          {cells.map((cell) => {
            const level =
              cell.count === 0 ? 0 : Math.min(4, Math.ceil((cell.count / max) * 4));
            return (
              <span
                key={cell.date}
                title={
                  cell.future
                    ? undefined
                    : tn("heatmap.cell", cell.count, { date: cell.date })
                }
                className={`h-2.5 w-2.5 rounded-sm sm:h-3 sm:w-3 ${
                  cell.future ? "bg-transparent" : INTENSITY[level]
                }`}
              />
            );
          })}
        </div>
      </div>
      <div
        className="flex items-center justify-end gap-1 text-xs uppercase tracking-wider text-zinc-400"
        aria-hidden="true"
      >
        <span>{t("heatmap.less")}</span>
        {INTENSITY.map((className, index) => (
          <span key={index} className={`h-2.5 w-2.5 rounded-sm ${className}`} />
        ))}
        <span>{t("heatmap.more")}</span>
      </div>
    </div>
  );
}
