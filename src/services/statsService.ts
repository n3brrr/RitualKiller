import { supabase } from "@/lib/supabase";
import { EMPTY_STATS, type UserStats } from "@/data/achievements";

export interface MyStats extends UserStats {
  firstCompletion: string | null;
}

/** Aggregates computed by the database (never limited by row caps). */
export const statsService = {
  async getMyStats(): Promise<MyStats> {
    const { data, error } = await supabase.rpc("my_stats");
    if (error) throw error;
    const raw = (data ?? {}) as Record<string, unknown>;
    const stats = { ...EMPTY_STATS };
    for (const key of Object.keys(stats) as Array<keyof UserStats>) {
      const value = Number(raw[key] ?? 0);
      stats[key] = Number.isFinite(value) ? value : 0;
    }
    return {
      ...stats,
      firstCompletion:
        typeof raw.first_completion === "string" ? raw.first_completion : null,
    };
  },
};
