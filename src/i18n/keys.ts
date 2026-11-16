import type { Difficulty, Frequency, Rarity } from "../types";
import type { es } from "./es";

export type TranslationKey = keyof typeof es;

/** Keys that have `.one` / `.other` plural variants, without the suffix. */
export type PluralKey = TranslationKey extends infer K
  ? K extends `${infer Base}.one`
    ? Base
    : never
  : never;

export type TranslationParams = Record<string, string | number>;

/** Translate function: optional {placeholders} are replaced with params. */
export type Translate = (key: TranslationKey, params?: TranslationParams) => string;

/** Replaces `{name}` placeholders; unknown placeholders are left untouched. */
export function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export const difficultyKeys: Record<Difficulty, TranslationKey> = {
  novice: "difficulty.novice",
  adept: "difficulty.adept",
  master: "difficulty.master",
};

export const frequencyKeys: Record<Frequency, TranslationKey> = {
  daily: "frequency.daily",
  weekly: "frequency.weekly",
};

export const rarityKeys: Record<Rarity, TranslationKey> = {
  common: "rarity.common",
  rare: "rarity.rare",
  legendary: "rarity.legendary",
};

export const achievementKey = (
  id: string,
  field: "name" | "description",
): TranslationKey => `achievement.${id}.${field}` as TranslationKey;

export const shopItemKey = (id: string, field: "name" | "description"): TranslationKey =>
  `item.${id}.${field}` as TranslationKey;

const RANK_KEYS: Record<string, TranslationKey> = {
  initiate: "rank.initiate",
  neophyte: "rank.neophyte",
  adept: "rank.adept",
  warlock: "rank.warlock",
  lich: "rank.lich",
  "demi-god": "rank.demigod",
};

/** `user.rank` llega en inglés desde el servicio; se traduce al vuelo. */
export function translateRank(title: string, t: Translate): string {
  const key = RANK_KEYS[title.toLowerCase()];
  return key ? t(key) : title;
}
