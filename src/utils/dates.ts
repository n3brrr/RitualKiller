/** Local calendar helpers. Never use `toISOString()` for user-facing dates: it shifts by timezone. */

export function toDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function lastNDays(days: number, now: Date = new Date()): string[] {
  if (days <= 0) return [];
  return Array.from({ length: days }, (_, index) =>
    toDateKey(addDays(now, index - days + 1)),
  );
}

export function formatDateKey(key: string, locale = "es"): string {
  const [year, month, day] = key.split("-").map(Number);
  if (!year || !month || !day) return key;
  return new Date(year, month - 1, day).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });
}

export function formatDateTime(value: string | number, locale = "es"): string {
  return new Date(value).toLocaleString(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseDateKey(key: string): Date | null {
  const [year, month, day] = key.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

/** Local Date for a `YYYY-MM-DD` key; falls back to the device date if invalid. */
export function dateFromKey(key: string): Date {
  return parseDateKey(key) ?? new Date();
}

export function isSameWeek(a: string, b: string): boolean {
  const first = parseDateKey(a);
  const second = parseDateKey(b);
  if (!first || !second) return false;

  const monday = (date: Date) => {
    const copy = new Date(date);
    copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7));
    return toDateKey(copy);
  };

  return monday(first) === monday(second);
}

export function daysUntil(dateKey: string, now: Date = new Date()): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return 0;
  const target = new Date(year, month - 1, day).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.ceil((target - today) / 86_400_000);
}
