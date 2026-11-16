import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Locale, Ritual, RitualLog } from "@/types";
import { useI18n } from "@/i18n";
import { toDateKey } from "@/utils/dates";

interface RitualCalendarProps {
  rituals: Ritual[];
  logs: RitualLog[];
}

const WEEKDAYS: Record<Locale, string[]> = {
  es: ["L", "M", "X", "J", "V", "S", "D"],
  en: ["M", "T", "W", "T", "F", "S", "S"],
};

export function RitualCalendar({ rituals, logs }: RitualCalendarProps) {
  const { t, locale } = useI18n();
  const [cursor, setCursor] = useState(() => new Date());
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const logsByDate = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const log of logs) {
      const date = log.date.slice(0, 10);
      const completed = map.get(date) ?? new Set<string>();
      completed.add(log.ritualId);
      map.set(date, completed);
    }
    return map;
  }, [logs]);

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = (firstDay.getDay() + 6) % 7;
  const todayKey = toDateKey();

  const monthLabel = cursor.toLocaleDateString(locale, { month: "long", year: "numeric" });

  const shiftMonth = (delta: number) => {
    setCursor(new Date(year, month + delta, 1));
  };

  return (
    <section aria-label={t("calendar.label")}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-300">
          {t("calendar.title")}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label={t("calendar.previous")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-white"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-32 text-center text-xs uppercase tracking-wider text-zinc-400">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label={t("calendar.next")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-white"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS[locale].map((day, index) => (
          <span key={index} className="pb-1 text-xs font-bold uppercase text-zinc-400">
            {day}
          </span>
        ))}

        {Array.from({ length: leadingBlanks }, (_, index) => (
          <span key={`blank-${index}`} aria-hidden="true" />
        ))}

        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const dateKey = toDateKey(new Date(year, month, day));
          const completed = logsByDate.get(dateKey)?.size ?? 0;
          const ratio = rituals.length > 0 ? Math.min(1, completed / rituals.length) : 0;
          const isToday = dateKey === todayKey;

          return (
            <div
              key={dateKey}
              aria-label={`${dateKey}: ${completed} ${t("calendar.of")} ${rituals.length} ${t("heatmap.rituals")}`}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-md border text-xs ${
                isToday ? "border-ritual-accent/60" : "border-zinc-900"
              } ${completed > 0 ? "bg-ritual-accent/10 text-zinc-100" : "text-zinc-400"}`}
            >
              <span>{day}</span>
              {completed > 0 && (
                <span
                  className="absolute bottom-1 h-0.5 w-3/4 overflow-hidden rounded-full bg-zinc-800"
                  aria-hidden="true"
                >
                  <span
                    className="block h-full bg-ritual-accent"
                    style={{ width: `${ratio * 100}%` }}
                  />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default RitualCalendar;
