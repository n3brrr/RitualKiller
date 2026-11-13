import type { Difficulty, Ritual, RitualLog } from "../types";
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

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  novice: "Novice",
  adept: "Intermediate",
  master: "Master",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

export function buildWeekdaySeries(logs: RitualLog[]): WeekdayPoint[] {
  const counts = new Map<number, number>();
  for (const log of logs) {
    const [year, month, day] = log.date.slice(0, 10).split("-").map(Number);
    if (!year || !month || !day) continue;
    const weekday = new Date(year, month - 1, day).getDay();
    counts.set(weekday, (counts.get(weekday) ?? 0) + 1);
  }
  return WEEKDAYS.map((name, index) => ({
    name,
    Completions: counts.get(index) ?? 0,
  }));
}

export function buildDifficultySeries(
  rituals: Ritual[],
  logs: RitualLog[],
): DifficultyPoint[] {
  const difficultyByRitual = new Map(rituals.map((ritual) => [ritual.id, ritual.difficulty]));
  const counts: Record<Difficulty, number> = { novice: 0, adept: 0, master: 0 };

  for (const log of logs) {
    const difficulty = difficultyByRitual.get(log.ritualId);
    if (difficulty) counts[difficulty] += 1;
  }

  return (Object.keys(counts) as Difficulty[])
    .filter((difficulty) => counts[difficulty] > 0)
    .map((difficulty) => ({
      name: DIFFICULTY_LABELS[difficulty],
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

export function calculateCompletionRate(
  rituals: Ritual[],
  logs: RitualLog[],
  days: number,
): number {
  if (rituals.length === 0 || days <= 0) return 0;
  const possible = rituals.length * days;
  return Math.min(100, (logs.length / possible) * 100);
}
