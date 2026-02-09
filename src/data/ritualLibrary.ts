import { Ritual } from '../types';

export type RitualCategory = 
  | 'health' 
  | 'productivity' 
  | 'mental' 
  | 'physical' 
  | 'social' 
  | 'learning' 
  | 'creativity' 
  | 'spiritual';

export interface RitualTemplate {
  id: string;
  title: string;
  description: string;
  difficulty: 'novice' | 'adept' | 'master';
  category: RitualCategory;
  frequency: 'daily' | 'weekly';
  essenceReward: number;
  tags: string[];
  popular?: boolean;
}

export const RITUAL_LIBRARY: RitualTemplate[] = [
  // Salud
  {
    id: 'lib-health-1',
    title: 'Hidratación Matutina',
    description: 'Bebe 500ml de agua al despertar antes de cualquier otra bebida.',
    difficulty: 'novice',
    category: 'health',
    frequency: 'daily',
    essenceReward: 10,
    tags: ['salud', 'hidratación', 'mañana'],
    popular: true,
  },
  {
    id: 'lib-health-2',
    title: 'Protocolo de Ducha Fría',
    description: 'Ducha fría de al menos 2 minutos para fortalecer la voluntad.',
    difficulty: 'adept',
    category: 'health',
    frequency: 'daily',
    essenceReward: 25,
    tags: ['salud', 'disciplina', 'frío'],
    popular: true,
  },
  {
    id: 'lib-health-3',
    title: '10K Pasos Diarios',
    description: 'Camina al menos 10,000 pasos cada día sin excepciones.',
    difficulty: 'adept',
    category: 'health',
    frequency: 'daily',
    essenceReward: 25,
    tags: ['salud', 'ejercicio', 'caminar'],
  },
  
  // Productividad
  {
    id: 'lib-prod-1',
    title: 'Sesión de Trabajo Profundo',
    description: '90 minutos de trabajo profundo sin distracciones ni interrupciones.',
    difficulty: 'adept',
    category: 'productivity',
    frequency: 'daily',
    essenceReward: 30,
    tags: ['productividad', 'concentración', 'trabajo'],
    popular: true,
  },
  {
    id: 'lib-prod-2',
    title: 'Protocolo de Despertar 5AM',
    description: 'Despierta a las 5:00 AM sin usar el botón de snooze.',
    difficulty: 'master',
    category: 'productivity',
    frequency: 'daily',
    essenceReward: 50,
    tags: ['productividad', 'disciplina', 'mañana'],
    popular: true,
  },
  {
    id: 'lib-prod-3',
    title: 'Sin Redes Sociales Antes del Mediodía',
    description: 'Evita todas las redes sociales hasta el mediodía.',
    difficulty: 'adept',
    category: 'productivity',
    frequency: 'daily',
    essenceReward: 25,
    tags: ['productividad', 'disciplina', 'digital'],
  },
  
  // Mental
  {
    id: 'lib-mental-1',
    title: 'Meditación Matutina',
    description: 'Meditación de 10 minutos al despertar para claridad mental.',
    difficulty: 'novice',
    category: 'mental',
    frequency: 'daily',
    essenceReward: 15,
    tags: ['mental', 'meditación', 'mindfulness'],
    popular: true,
  },
  {
    id: 'lib-mental-2',
    title: 'Diario de Gratitud',
    description: 'Escribe 3 cosas por las que estás agradecido cada noche.',
    difficulty: 'novice',
    category: 'mental',
    frequency: 'daily',
    essenceReward: 10,
    tags: ['mental', 'gratitud', 'escritura'],
  },
  {
    id: 'lib-mental-3',
    title: 'Ocaso Digital',
    description: 'Apaga todos los dispositivos electrónicos 2 horas antes de dormir.',
    difficulty: 'adept',
    category: 'mental',
    frequency: 'daily',
    essenceReward: 20,
    tags: ['mental', 'sueño', 'digital'],
  },
  
  // Físico
  {
    id: 'lib-physical-1',
    title: 'Flexiones Diarias',
    description: 'Completa 50 flexiones distribuidas durante el día.',
    difficulty: 'adept',
    category: 'physical',
    frequency: 'daily',
    essenceReward: 25,
    tags: ['físico', 'ejercicio', 'fuerza'],
  },
  {
    id: 'lib-physical-2',
    title: 'Desafío de Plancha',
    description: 'Mantén una plancha durante 2 minutos sin interrupciones.',
    difficulty: 'master',
    category: 'physical',
    frequency: 'daily',
    essenceReward: 40,
    tags: ['físico', 'ejercicio', 'core'],
  },
  
  // Aprendizaje
  {
    id: 'lib-learning-1',
    title: 'Leer 20 Páginas',
    description: 'Lee al menos 20 páginas de un libro educativo cada día.',
    difficulty: 'novice',
    category: 'learning',
    frequency: 'daily',
    essenceReward: 15,
    tags: ['aprendizaje', 'lectura', 'conocimiento'],
    popular: true,
  },
  {
    id: 'lib-learning-2',
    title: 'Programar por 1 Hora',
    description: 'Dedica 1 hora completa a programar o aprender programación.',
    difficulty: 'adept',
    category: 'learning',
    frequency: 'daily',
    essenceReward: 30,
    tags: ['aprendizaje', 'programación', 'habilidades'],
  },
  
  // Creatividad
  {
    id: 'lib-creativity-1',
    title: 'Producción Creativa Diaria',
    description: 'Crea algo nuevo cada día: dibujo, escritura, música, etc.',
    difficulty: 'novice',
    category: 'creativity',
    frequency: 'daily',
    essenceReward: 20,
    tags: ['creatividad', 'arte', 'expresión'],
  },
  
  // Espiritual
  {
    id: 'lib-spiritual-1',
    title: 'Reflexión Vespertina',
    description: 'Reflexiona sobre el día durante 15 minutos antes de dormir.',
    difficulty: 'novice',
    category: 'spiritual',
    frequency: 'daily',
    essenceReward: 15,
    tags: ['espiritual', 'reflexión', 'crecimiento'],
  },
];

export const getRitualsByCategory = (category: RitualCategory): RitualTemplate[] => {
  return RITUAL_LIBRARY.filter(r => r.category === category);
};

export const getPopularRituals = (): RitualTemplate[] => {
  return RITUAL_LIBRARY.filter(r => r.popular);
};

export const searchRituals = (query: string): RitualTemplate[] => {
  const lowerQuery = query.toLowerCase();
  return RITUAL_LIBRARY.filter(r => 
    r.title.toLowerCase().includes(lowerQuery) ||
    r.description.toLowerCase().includes(lowerQuery) ||
    r.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

export const convertTemplateToRitual = (template: RitualTemplate, userId: string): Ritual => {
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
