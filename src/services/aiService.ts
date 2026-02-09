import { generateRitualSuggestions } from './geminiService';
import { Ritual, RitualLog } from '../types';

export interface ProgressAnalysis {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  overallScore: number;
}

export const analyzeProgress = async (
  rituals: Ritual[],
  logs: RitualLog[]
): Promise<ProgressAnalysis> => {
  // Calculate basic metrics
  const completionRate = rituals.length > 0
    ? (logs.length / (rituals.length * 30)) * 100
    : 0;

  const avgStreak = rituals.length > 0
    ? rituals.reduce((sum, r) => sum + (r.streak || 0), 0) / rituals.length
    : 0;

  const recentLogs = logs.filter(log => {
    const logDate = new Date(log.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return logDate >= weekAgo;
  });

  const weeklyCompletionRate = rituals.length > 0
    ? (recentLogs.length / (rituals.length * 7)) * 100
    : 0;

  // Generate analysis
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  if (completionRate >= 80) {
    strengths.push('Excelente tasa de completitud general');
  } else if (completionRate < 50) {
    weaknesses.push('Tasa de completitud por debajo del objetivo');
    recommendations.push('Considera reducir el número de rituales o ajustar su dificultad');
  }

  if (avgStreak >= 7) {
    strengths.push('Rachas consistentes y duraderas');
  } else if (avgStreak < 3) {
    weaknesses.push('Rachas cortas, dificultad para mantener consistencia');
    recommendations.push('Enfócate en completar al menos un ritual diario para construir momentum');
  }

  if (weeklyCompletionRate >= 80) {
    strengths.push('Excelente desempeño en la última semana');
  } else {
    weaknesses.push('Desempeño semanal necesita mejora');
    recommendations.push('Establece recordatorios diarios para tus rituales más importantes');
  }

  const overallScore = Math.round(
    (completionRate * 0.4 + (avgStreak / 10) * 30 + weeklyCompletionRate * 0.3)
  );

  return {
    strengths,
    weaknesses,
    recommendations,
    overallScore: Math.min(100, Math.max(0, overallScore)),
  };
};

export const getMotivationalMessage = async (): Promise<string> => {
  const messages = [
    'La disciplina es la puerta hacia la libertad. Cada ritual completado te acerca más.',
    'Los pequeños pasos consistentes superan a los grandes saltos esporádicos.',
    'Tu futuro se construye hoy, ritual por ritual.',
    'La excelencia no es un acto, sino un hábito. Continúa.',
    'Cada día es una nueva oportunidad para ser mejor que ayer.',
  ];

  return messages[Math.floor(Math.random() * messages.length)];
};

export const generatePersonalizedRituals = async (
  goal: string,
  currentRituals: Ritual[]
): Promise<any[]> => {
  // Use existing service but with context
  const suggestions = await generateRitualSuggestions(goal);
  
  // Filter out rituals similar to existing ones
  const existingTitles = currentRituals.map(r => r.title.toLowerCase());
  return suggestions.filter(s => 
    !existingTitles.some(title => title.includes(s.title.toLowerCase().substring(0, 5)))
  );
};
