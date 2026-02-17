/*
 * achievements.ts
 *
 * Define la lista base de logros (achievements) y utilidades relacionadas para el sistema de logros de la aplicación.
 * - Contiene los logros configurados (sin progreso) y funciones para calcular el avance de cada logro y obtener los desbloqueados.
 */

import { Achievement, Rarity } from '../types';

// Lista de logros base, omitimos campos que dependen del usuario como progreso/fecha de desbloqueo
export const ACHIEVEMENTS: Omit<Achievement, 'progress' | 'unlockedAt'>[] = [
  // Logros de racha de días completando rituales
  {
    id: 'ach-streak-7',
    name: 'Primera Semana',
    description: 'Completa todos tus rituales por 7 días consecutivos',
    icon: '🔥',
    rarity: 'common',
    target: 7,
    category: 'streak',
  },
  {
    id: 'ach-streak-30',
    name: 'Maestro del Mes',
    description: 'Mantén una racha de 30 días sin romperla',
    icon: '👑',
    rarity: 'rare',
    target: 30,
    category: 'streak',
  },
  {
    id: 'ach-streak-100',
    name: 'Invencible',
    description: 'Alcanza una racha de 100 días',
    icon: '💀',
    rarity: 'legendary',
    target: 100,
    category: 'streak',
  },
  // Logros por acumular esencia
  {
    id: 'ach-essence-1000',
    name: 'Acumulador',
    description: 'Acumula 1,000 esencia',
    icon: '💎',
    rarity: 'common',
    target: 1000,
    category: 'essence',
  },
  {
    id: 'ach-essence-10000',
    name: 'Ascendido',
    description: 'Alcanza 10,000 esencia acumulada',
    icon: '⚡',
    rarity: 'rare',
    target: 10000,
    category: 'essence',
  },
  {
    id: 'ach-essence-50000',
    name: 'Semidiós',
    description: 'Acumula 50,000 esencia',
    icon: '🌟',
    rarity: 'legendary',
    target: 50000,
    category: 'essence',
  },
  // Logros por crear o completar rituales
  {
    id: 'ach-rituals-10',
    name: 'Iniciado',
    description: 'Crea 10 rituales',
    icon: '📜',
    rarity: 'common',
    target: 10,
    category: 'rituals',
  },
  {
    id: 'ach-rituals-50',
    name: 'Coleccionista',
    description: 'Crea 50 rituales diferentes',
    icon: '📚',
    rarity: 'rare',
    target: 50,
    category: 'rituals',
  },
  {
    id: 'ach-complete-100',
    name: 'Centurión',
    description: 'Completa 100 rituales en total',
    icon: '🏆',
    rarity: 'rare',
    target: 100,
    category: 'rituals',
  },
  // Logros sociales (interacción en comunidad)
  {
    id: 'ach-social-first',
    name: 'Primera Voz',
    description: 'Publica tu primer post en la comunidad',
    icon: '📢',
    rarity: 'common',
    target: 1,
    category: 'social',
  },
  {
    id: 'ach-social-10',
    name: 'Influencer',
    description: 'Publica 10 posts',
    icon: '📱',
    rarity: 'common',
    target: 10,
    category: 'social',
  },
  // Logros especiales
  {
    id: 'ach-perfect-week',
    name: 'Semana Perfecta',
    description: 'Completa todos los rituales todos los días de la semana',
    icon: '✨',
    rarity: 'rare',
    target: 7,
    category: 'special',
  },
  {
    id: 'ach-all-difficulties',
    name: 'Maestro Completo',
    description: 'Completa rituales de todas las dificultades',
    icon: '🎯',
    rarity: 'rare',
    target: 3,
    category: 'special',
  },
];

/*
 * Calcula el progreso actual de un logro según los datos del usuario.
 * @param achievement Objeto de logro a evaluar.
 * @param userData Información relevante del usuario: rituales, logs, esencia, posts.
 * @returns Progreso numérico para el logro.
 */
export const calculateAchievementProgress = (
  achievement: Omit<Achievement, 'progress' | 'unlockedAt'>,
  userData: {
    rituals: any[];
    logs: any[];
    essence: number;
    posts?: any[];
  }
): number => {
  switch (achievement.category) {
    case 'streak':
      // Máxima racha registrada entre los rituales del usuario
      const maxStreak = Math.max(...userData.rituals.map(r => r.streak || 0), 0);
      return Math.min(maxStreak, achievement.target);

    case 'essence':
      // Esencia acumulada por el usuario
      return Math.min(userData.essence, achievement.target);

    case 'rituals':
      // Si el logro es de completar, cuenta logs. Si es de creación, cuenta rituales distintos
      if (achievement.id.includes('complete')) {
        return Math.min(userData.logs.length, achievement.target);
      }
      return Math.min(userData.rituals.length, achievement.target);

    case 'social':
      // Cantidad de publicaciones en la comunidad
      return Math.min((userData.posts?.length || 0), achievement.target);

    case 'special':
      if (achievement.id === 'ach-perfect-week') {
        // Lógica especial pendiente para 'Semana Perfecta'
        return 0;
      }
      if (achievement.id === 'ach-all-difficulties') {
        // Cuántas dificultades distintas de rituales ha completado el usuario
        const difficulties = new Set(userData.rituals.map(r => r.difficulty));
        return Math.min(difficulties.size, achievement.target);
      }
      return 0;

    default:
      return 0;
  }
};

/*
 * Retorna los logros desbloqueados (aquellos con progreso completo y fecha de desbloqueo).
 * @param achievements Lista de logros con progreso y fecha.
 * @returns Sólo los logros desbloqueados por el usuario.
 */
export const getUnlockedAchievements = (
  achievements: Achievement[]
): Achievement[] => {
  return achievements.filter(a => a.progress >= a.target && a.unlockedAt);
};
