import type { Difficulty, Locale } from "@/types";

/** A ritual proposed by an AI provider, already validated and trimmed. */
export interface RitualSuggestion {
  title: string;
  description: string;
  difficulty: Difficulty;
}

export interface SuggestRitualsInput {
  /** What the user wants to achieve, free text (max 200 characters). */
  goal: string;
  /** The answer must be written in the user's language. */
  locale: Locale;
}

/**
 * Contract every AI integration must implement.
 *
 * Model calls never run in the browser: providers talk to a server-side endpoint
 * (see supabase/functions/ai-suggest-rituals) that validates the session, applies
 * the per-user quota and keeps any provider key as a server secret.
 */
export interface AiProvider {
  readonly id: string;
  /** False when the feature flag is off or no backend is configured. */
  readonly available: boolean;
  suggestRituals(input: SuggestRitualsInput): Promise<RitualSuggestion[]>;
}

export class AiUnavailableError extends Error {
  constructor(message = "AI features are not available") {
    super(message);
    this.name = "AiUnavailableError";
  }
}
