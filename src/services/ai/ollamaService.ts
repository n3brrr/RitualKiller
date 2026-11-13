import type { Difficulty } from "@/types";

export interface RitualSuggestion {
  title: string;
  description: string;
  difficulty: Difficulty;
}

const DIFFICULTIES: Difficulty[] = ["novice", "adept", "master"];

export function fallbackSuggestions(goal: string): RitualSuggestion[] {
  const shortGoal = goal.trim().slice(0, 20) || "tu objetivo";
  return [
    {
      title: `Protocolo: ${shortGoal}`,
      description: `Entrenamiento diario riguroso enfocado en ${goal.trim() || "tu objetivo"}. Sin excusas.`,
      difficulty: "adept",
    },
    {
      title: `Senda de ${shortGoal}`,
      description: `Pasos pequeños y constantes hacia ${goal.trim() || "tu objetivo"}.`,
      difficulty: "novice",
    },
    {
      title: `Maestría de ${shortGoal}`,
      description: `Inmersión extrema en ${goal.trim() || "tu objetivo"}. El sufrimiento está garantizado.`,
      difficulty: "master",
    },
  ];
}

function sanitizeSuggestions(value: unknown): RitualSuggestion[] {
  const list = Array.isArray(value)
    ? value
    : value && typeof value === "object" && Array.isArray((value as { rituals?: unknown }).rituals)
      ? (value as { rituals: unknown[] }).rituals
      : [];

  return list
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const title = typeof record.title === "string" ? record.title.trim().slice(0, 100) : "";
      const description =
        typeof record.description === "string" ? record.description.trim().slice(0, 500) : "";
      const difficulty = DIFFICULTIES.includes(record.difficulty as Difficulty)
        ? (record.difficulty as Difficulty)
        : "novice";
      if (!title) return null;
      return { title, description, difficulty };
    })
    .filter((item): item is RitualSuggestion => item !== null)
    .slice(0, 5);
}

export function parseOllamaResponse(text: string): RitualSuggestion[] {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try {
    return sanitizeSuggestions(JSON.parse(jsonMatch[0]));
  } catch {
    return [];
  }
}

export async function generateRitualSuggestions(goal: string): Promise<RitualSuggestion[]> {
  const cleanGoal = goal.trim().slice(0, 200);
  if (!cleanGoal) return fallbackSuggestions("tu objetivo");

  const model = import.meta.env.VITE_OLLAMA_MODEL || "llama3.2";
  const prompt = `Generate 3 distinct habit suggestions (Rituals) for someone who wants to achieve this goal: "${cleanGoal}".
Keep the tone dark, serious, and disciplined (Stoic/Gothic). Each ritual should be challenging and meaningful.
Return ONLY a valid JSON array with this exact structure:
[{"title":"Ritual name","description":"Detailed description","difficulty":"novice" | "adept" | "master"}]`;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch("/ollama/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ model, prompt, stream: false, format: "json" }),
    });
    if (!response.ok) throw new Error(`Ollama respondió ${response.status}`);

    const payload = (await response.json()) as { response?: unknown };
    if (typeof payload.response !== "string") throw new Error("Respuesta de Ollama inválida");

    const suggestions = parseOllamaResponse(payload.response);
    return suggestions.length > 0 ? suggestions : fallbackSuggestions(cleanGoal);
  } catch (error) {
    console.warn("Ollama no disponible, usando sugerencias locales:", error);
    return fallbackSuggestions(cleanGoal);
  } finally {
    window.clearTimeout(timeout);
  }
}
