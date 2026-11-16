import type { TranslationKey } from "@/i18n";

/** Daily quotes, translated as quote.0 … quote.9. */
export const QUOTE_KEYS: TranslationKey[] = Array.from(
  { length: 10 },
  (_, index) => `quote.${index}` as TranslationKey,
);

/** Same quote for the whole day, rotating by day of the year. */
export function quoteKeyFor(date: Date = new Date()): TranslationKey {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return QUOTE_KEYS[dayOfYear % QUOTE_KEYS.length] ?? "quote.0";
}
