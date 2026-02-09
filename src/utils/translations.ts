import { Difficulty, Rarity } from '../types';

/**
 * Utilidades de traducción para textos comunes de la UI
 */

export const translateDifficulty = (difficulty: Difficulty): string => {
  const translations: Record<Difficulty, string> = {
    novice: 'Novato',
    adept: 'Intermedio',
    master: 'Maestro',
  };
  return translations[difficulty] || difficulty;
};

export const translateRarity = (rarity: Rarity): string => {
  const translations: Record<Rarity, string> = {
    common: 'Común',
    rare: 'Raro',
    legendary: 'Legendario',
  };
  return translations[rarity] || rarity;
};

export const translateFrequency = (frequency: 'daily' | 'weekly'): string => {
  const translations = {
    daily: 'Diario',
    weekly: 'Semanal',
  };
  return translations[frequency] || frequency;
};

export const translateRank = (rank: string): string => {
  const translations: Record<string, string> = {
    'Iniciado': 'Iniciado',
    'Neófito': 'Neófito',
    'Adepto': 'Adepto',
    'Brujo': 'Brujo',
    'Liche': 'Liche',
    'Semidiós': 'Semidiós',
    'Unkindled': 'Iniciado',
    'Neophyte': 'Neófito',
    'Adept': 'Adepto',
    'Warlock': 'Brujo',
    'Lich': 'Liche',
    'Demi-God': 'Semidiós',
  };
  return translations[rank] || rank;
};
