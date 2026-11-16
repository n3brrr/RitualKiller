import type { Difficulty, Locale, Ritual, RitualLog } from "../types";
import { formatDateKey, isSameWeek, lastNDays, toDateKey } from "./dates";

export interface DailyPoint {
  date: string;
  label: string;
  Completions: number;
}

export interface WeekdayPoint {
  name: string;
  Completions: number;
}

export interface DifficultyPoint {
  name: string;
  Completions: number;
}

const DIFFICULTY_LABELS: Record<Locale, Record<Difficulty, string>> = {
  es: { novice: "Novato", adept: "Intermedio", master: "Maestro" },
  en: { novice: "Novice", adept: "Intermediate", master: "Master" },
};

export function filterLogsByDays(
  logs: RitualLog[],
  days: number,
  now: Date = new Date(),
): RitualLog[] {
  const allowed = new Set(lastNDays(days, now));
  return logs.filter((log) => allowed.has(log.date.slice(0, 10)));
}

export function buildDailySeries(
  logs: RitualLog[],
  days: number,
  now: Date = new Date(),
  locale = "es",
): DailyPoint[] {
  const counts = new Map<string, number>();
  for (const log of filterLogsByDays(logs, days, now)) {
    const key = log.date.slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return lastNDays(days, now).map((date) => ({
    date,
    label: formatDateKey(date, locale),
    Completions: counts.get(date) ?? 0,
  }));
}

export function buildWeekdaySeries(logs: RitualLog[], locale = "es"): WeekdayPoint[] {
  const counts = new Map<number, number>();
  for (const log of logs) {
    const [year, month, day] = log.date.slice(0, 10).split("-").map(Number);
    if (!year || !month || !day) continue;
    const weekday = new Date(year, month - 1, day).getDay();
    counts.set(weekday, (counts.get(weekday) ?? 0) + 1);
  }
  return Array.from({ length: 7 }, (_, index) => {
    const name = new Date(2024, 0, 7 + index).toLocaleDateString(locale, {
      weekday: "short",
    });
    return {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      Completions: counts.get(index) ?? 0,
    };
  });
}

export function buildDifficultySeries(
  rituals: Ritual[],
  logs: RitualLog[],
  locale: Locale = "en",
): DifficultyPoint[] {
  const difficultyByRitual = new Map(
    rituals.map((ritual) => [ritual.id, ritual.difficulty]),
  );
  const counts: Record<Difficulty, number> = { novice: 0, adept: 0, master: 0 };

  for (const log of logs) {
    const difficulty = difficultyByRitual.get(log.ritualId);
    if (difficulty) counts[difficulty] += 1;
  }

  return (Object.keys(counts) as Difficulty[])
    .filter((difficulty) => counts[difficulty] > 0)
    .map((difficulty) => ({
      name: DIFFICULTY_LABELS[locale][difficulty],
      Completions: counts[difficulty],
    }));
}

/** Daily rituals count once per day; weekly rituals count once per Monday-based week. */
export function isRitualCompleted(
  ritual: Pick<Ritual, "id" | "frequency">,
  logs: RitualLog[],
  now: Date = new Date(),
): boolean {
  const today = toDateKey(now);
  return logs.some((log) => {
    if (log.ritualId !== ritual.id) return false;
    const date = log.date.slice(0, 10);
    return ritual.frequency === "weekly" ? isSameWeek(date, today) : date === today;
  });
}

/**
 * How many completions were possible in the last `days` days: one per day for
 * daily rituals and one per Monday-based week for weekly rituals, counted only
 * from the day each ritual was created.
 */
export function countOpportunities(
  rituals: Pick<Ritual, "frequency" | "created_at">[],
  days: number,
  now: Date = new Date(),
): number {
  const window = lastNDays(days, now);
  if (window.length === 0) return 0;
  let total = 0;
  for (const ritual of rituals) {
    const created = toDateKey(new Date(ritual.created_at));
    const active = window.filter((day) => day >= created);
    if (ritual.frequency === "weekly") {
      total += new Set(active.map((day) => mondayOf(day))).size;
    } else {
      total += active.length;
    }
  }
  return total;
}

function mondayOf(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return toDateKey(date);
}

/** Completions in the window divided by the real number of opportunities. */
export function calculateCompletionRate(
  rituals: Ritual[],
  logs: RitualLog[],
  days: number,
  now: Date = new Date(),
): number {
  const possible = countOpportunities(rituals, days, now);
  if (possible === 0) return 0;
  return Math.min(100, (filterLogsByDays(logs, days, now).length / possible) * 100);
}
