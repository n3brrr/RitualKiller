/*
 * ritualLibrary.ts
 *
 * Define la biblioteca de rituales sugeridos (plantillas) y utilidades asociadas.
 * Permite acceder rápidamente a rituales predefinidos, filtrarlos por categoría, popularidad o buscar,
 * y convertir una plantilla en un ritual concreto de usuario.
 */

import { Ritual } from "../types";

// Categorías posibles de rituales sugeridos
export type RitualCategory =
  | "health"
  | "productivity"
  | "mental"
  | "physical"
  | "social"
  | "learning"
  | "creativity"
  | "spiritual";

// Plantilla base para sugerir un ritual
export interface RitualTemplate {
  id: string;
  title: string;
  description: string;
  difficulty: "novice" | "adept" | "master";
  category: RitualCategory;
  frequency: "daily" | "weekly";
  essenceReward: number;
  tags: string[];
  popular?: boolean;
}

// Lista estática de rituales sugeridos
export const RITUAL_LIBRARY: RitualTemplate[] = [
  // Salud
  {
    id: "lib-health-1",
    title: "Morning Hydration",
    description:
      "Drink 500ml of water upon waking up before any other beverage.",
    difficulty: "novice",
    category: "health",
    frequency: "daily",
    essenceReward: 10,
    tags: ["health", "hydration", "morning"],
    popular: true,
  },
  {
    id: "lib-health-2",
    title: "Cold Shower Protocol",
    description: "Cold shower for at least 2 minutes to strengthen willpower.",
    difficulty: "adept",
    category: "health",
    frequency: "daily",
    essenceReward: 25,
    tags: ["health", "discipline", "cold"],
    popular: true,
  },
  {
    id: "lib-health-3",
    title: "10K Daily Steps",
    description: "Walk at least 10,000 steps every day without exception.",
    difficulty: "adept",
    category: "health",
    frequency: "daily",
    essenceReward: 25,
    tags: ["health", "exercise", "walking"],
  },
  // Productividad
  {
    id: "lib-prod-1",
    title: "Deep Work Session",
    description:
      "90 minutes of deep work without distractions or interruptions.",
    difficulty: "adept",
    category: "productivity",
    frequency: "daily",
    essenceReward: 30,
    tags: ["productivity", "concentration", "work"],
    popular: true,
  },
  {
    id: "lib-prod-2",
    title: "5 AM Wake-up Protocol",
    description: "Wake up at 5:00 AM without using the snooze button.",
    difficulty: "master",
    category: "productivity",
    frequency: "daily",
    essenceReward: 50,
    tags: ["productivity", "discipline", "morning"],
    popular: true,
  },
  {
    id: "lib-prod-3",
    title: "No Social Media Before Noon",
    description: "Avoid all social media until noon.",
    difficulty: "adept",
    category: "productivity",
    frequency: "daily",
    essenceReward: 25,
    tags: ["productivity", "discipline", "digital"],
  },
  // Mental
  {
    id: "lib-mental-1",
    title: "Morning Meditation",
    description: "10-minute meditation upon waking up for mental clarity.",
    difficulty: "novice",
    category: "mental",
    frequency: "daily",
    essenceReward: 15,
    tags: ["mental", "meditation", "mindfulness"],
    popular: true,
  },
  {
    id: "lib-mental-2",
    title: "Gratitude Journal",
    description: "Write 3 things you are grateful for every night.",
    difficulty: "novice",
    category: "mental",
    frequency: "daily",
    essenceReward: 10,
    tags: ["mental", "gratitude", "writing"],
  },
  {
    id: "lib-mental-3",
    title: "Digital Sunset",
    description: "Turn off all electronic devices 2 hours before sleeping.",
    difficulty: "adept",
    category: "mental",
    frequency: "daily",
    essenceReward: 20,
    tags: ["mental", "sleep", "digital"],
  },
  // Físico
  {
    id: "lib-physical-1",
    title: "Daily Push-ups",
    description: "Complete 50 push-ups distributed throughout the day.",
    difficulty: "adept",
    category: "physical",
    frequency: "daily",
    essenceReward: 25,
    tags: ["physical", "exercise", "strength"],
  },
  {
    id: "lib-physical-2",
    title: "Plank Challenge",
    description: "Hold a plank for 2 minutes without interruptions.",
    difficulty: "master",
    category: "physical",
    frequency: "daily",
    essenceReward: 40,
    tags: ["physical", "exercise", "core"],
  },
  // Aprendizaje
  {
    id: "lib-learning-1",
    title: "Read 20 Pages",
    description: "Read at least 20 pages of an educational book every day.",
    difficulty: "novice",
    category: "learning",
    frequency: "daily",
    essenceReward: 15,
    tags: ["learning", "reading", "knowledge"],
    popular: true,
  },
  {
    id: "lib-learning-2",
    title: "Code for 1 Hour",
    description: "Dedicate 1 full hour to coding or learning programming.",
    difficulty: "adept",
    category: "learning",
    frequency: "daily",
    essenceReward: 30,
    tags: ["learning", "programming", "skills"],
  },
  // Creatividad
  {
    id: "lib-creativity-1",
    title: "Daily Creative Production",
    description:
      "Create something new every day: drawing, writing, music, etc.",
    difficulty: "novice",
    category: "creativity",
    frequency: "daily",
    essenceReward: 20,
    tags: ["creativity", "art", "expression"],
  },
  // Espiritual
  {
    id: "lib-spiritual-1",
    title: "Evening Reflection",
    description: "Reflect on the day for 15 minutes before sleeping.",
    difficulty: "novice",
    category: "spiritual",
    frequency: "daily",
    essenceReward: 15,
    tags: ["spiritual", "reflection", "growth"],
  },
];

// Obtiene rituales según una categoría dada
export const getRitualsByCategory = (
  category: RitualCategory,
): RitualTemplate[] => {
  return RITUAL_LIBRARY.filter((r) => r.category === category);
};

// Obtiene rituales marcados como populares
export const getPopularRituals = (): RitualTemplate[] => {
  return RITUAL_LIBRARY.filter((r) => r.popular);
};

// Busca rituales por palabra clave en título, descripción o tags
export const searchRituals = (query: string): RitualTemplate[] => {
  const lowerQuery = query.toLowerCase();
  return RITUAL_LIBRARY.filter(
    (r) =>
      r.title.toLowerCase().includes(lowerQuery) ||
      r.description.toLowerCase().includes(lowerQuery) ||
      r.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
  );
};

// Convierte una plantilla predefinida en un ritual de usuario real
export const convertTemplateToRitual = (
  template: RitualTemplate,
  userId: string,
): Ritual => {
  return {
    id: `${template.id}-${Date.now()}`,
    user_id: userId,
    title: template.title,
    description: template.description,
    difficulty: template.difficulty,
    frequency: template.frequency,
    essenceReward: template.essenceReward,
    streak: 0,
    created_at: new Date().toISOString(),
  };
};
