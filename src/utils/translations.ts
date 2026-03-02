import { Difficulty, Rarity } from "../types";

/**
 * Utilidades de traducción para textos comunes de la UI
 */

export const translateDifficulty = (difficulty: Difficulty): string => {
  const translations: Record<Difficulty, string> = {
    novice: "Novice",
    adept: "Intermediate",
    master: "Master",
  };
  return translations[difficulty] || difficulty;
};

export const translateRarity = (rarity: Rarity): string => {
  const translations: Record<Rarity, string> = {
    common: "Common",
    rare: "Rare",
    legendary: "Legendary",
  };
  return translations[rarity] || rarity;
};

export const translateFrequency = (frequency: "daily" | "weekly"): string => {
  const translations = {
    daily: "Daily",
    weekly: "Weekly",
  };
  return translations[frequency] || frequency;
};

export const translateRank = (rank: string): string => {
  const translations: Record<string, string> = {
    Iniciado: "Initiate",
    Neófito: "Neophyte",
    Adepto: "Adept",
    Brujo: "Warlock",
    Liche: "Lich",
    Semidiós: "Demi-God",
    Unkindled: "Initiate",
    Neophyte: "Neophyte",
    Adept: "Adept",
    Warlock: "Warlock",
    Lich: "Lich",
    "Demi-God": "Demi-God",
  };
  return translations[rank] || rank;
};
