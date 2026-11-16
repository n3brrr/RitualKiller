import { supabase } from "@/lib/supabase";
import { normalizeGoal, sanitizeSuggestions } from "./sanitize";
import {
  AiUnavailableError,
  type AiProvider,
  type RitualSuggestion,
  type SuggestRitualsInput,
} from "./types";

export type { AiProvider, RitualSuggestion, SuggestRitualsInput } from "./types";
export { AiUnavailableError } from "./types";

/** Feature flag: AI entry points stay hidden unless VITE_AI_ENABLED is "true". */
export function isAiEnabled(): boolean {
  return import.meta.env.VITE_AI_ENABLED === "true";
}

/** Default provider: the feature is off, every call is rejected. */
export const disabledProvider: AiProvider = {
  id: "disabled",
  available: false,
  async suggestRituals(): Promise<RitualSuggestion[]> {
    throw new AiUnavailableError();
  },
};

/**
 * Calls the authenticated `ai-suggest-rituals` Edge Function. The function owns
 * the provider key, the quota and the prompt, so the browser never talks to a
 * model directly.
 */
export const edgeFunctionProvider: AiProvider = {
  id: "supabase-edge",
  available: true,
  async suggestRituals(input: SuggestRitualsInput): Promise<RitualSuggestion[]> {
    const goal = normalizeGoal(input.goal);
    if (!goal) return [];
    const { data, error } = await supabase.functions.invoke("ai-suggest-rituals", {
      body: { goal, locale: input.locale },
    });
    if (error) throw error;
    return sanitizeSuggestions(data);
  },
};

export function getAiProvider(): AiProvider {
  return isAiEnabled() ? edgeFunctionProvider : disabledProvider;
}
