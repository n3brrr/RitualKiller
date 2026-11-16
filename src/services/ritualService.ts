import { supabase } from "@/lib/supabase";
import type { Difficulty, Frequency, Ritual, RitualLog } from "@/types";
import type { ExportData } from "@/utils/exportImport";

interface RitualRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  frequency: Frequency;
  streak: number;
  best_streak: number;
  current_streak?: number;
  essence_reward: number;
  created_at: string;
  archived_at?: string | null;
}

interface LogRow {
  id: string;
  ritual_id: string;
  user_id: string;
  date: string;
  essence_gained: number;
  protected: boolean;
}

export interface RitualBundle {
  /** Active rituals with their live streak. */
  rituals: Ritual[];
  /** Archived rituals: hidden from the lists, kept for history and exports. */
  archived: Ritual[];
  logs: RitualLog[];
}

export interface CompleteResult {
  success: boolean;
  reason?: string;
  essence_gained?: number;
  streak?: number;
}

export interface CreateRitualInput {
  title: string;
  description: string;
  difficulty: Difficulty;
  frequency: Frequency;
}

function mapRitual(row: RitualRow): Ritual {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    difficulty: row.difficulty,
    frequency: row.frequency,
    streak: row.current_streak ?? row.streak,
    bestStreak: Math.max(row.best_streak ?? 0, row.current_streak ?? 0),
    essenceReward: row.essence_reward,
    created_at: row.created_at,
  };
}

function mapLog(row: LogRow): RitualLog {
  return {
    id: row.id,
    ritualId: row.ritual_id,
    user_id: row.user_id,
    date: row.date,
    essence_gained: row.essence_gained,
    protected: row.protected,
  };
}

export const ritualService = {
  async list(userId: string): Promise<RitualBundle> {
    const [ritualsResult, archivedResult, logsResult] = await Promise.all([
      supabase
        .from("rituals_with_streak")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("rituals")
        .select("*")
        .eq("user_id", userId)
        .not("archived_at", "is", null),
      supabase
        .from("ritual_logs")
        .select("*")
        .eq("user_id", userId)
        // Days filled by the Potion of Oblivion keep streaks alive on the server
        // but are not completions, so they stay out of stats and calendars.
        .eq("protected", false)
        .order("date", { ascending: true }),
    ]);

    if (ritualsResult.error) throw ritualsResult.error;
    if (archivedResult.error) throw archivedResult.error;
    if (logsResult.error) throw logsResult.error;

    return {
      rituals: ((ritualsResult.data ?? []) as RitualRow[]).map(mapRitual),
      archived: ((archivedResult.data ?? []) as RitualRow[]).map((row) => ({
        ...mapRitual(row),
        streak: 0,
      })),
      logs: ((logsResult.data ?? []) as LogRow[]).map(mapLog),
    };
  },

  async create(userId: string, input: CreateRitualInput): Promise<Ritual> {
    const { data, error } = await supabase
      .from("rituals")
      .insert({
        user_id: userId,
        title: input.title.trim(),
        description: input.description.trim(),
        difficulty: input.difficulty,
        frequency: input.frequency,
      })
      .select("*")
      .single();
    if (error) throw error;
    return mapRitual(data as RitualRow);
  },

  /** Rituals are archived, never deleted, so their history is preserved. */
  async archive(id: string): Promise<void> {
    const { error } = await supabase
      .from("rituals")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  /** The server decides the date ("today" in the user's time zone). */
  async complete(id: string): Promise<CompleteResult> {
    const { data, error } = await supabase.rpc("complete_ritual", { p_ritual_id: id });
    if (error) throw error;
    return data as CompleteResult;
  },

  async undo(id: string): Promise<CompleteResult> {
    const { data, error } = await supabase.rpc("undo_ritual", { p_ritual_id: id });
    if (error) throw error;
    return data as CompleteResult;
  },

  /** Re-inserts a backup under the current account, remapping ritual ids. */
  async importBackup(
    userId: string,
    backup: ExportData,
  ): Promise<{ rituals: number; logs: number }> {
    const idMap = new Map<string, string>();
    let ritualCount = 0;
    let logCount = 0;

    for (const ritual of backup.rituals) {
      const { data, error } = await supabase
        .from("rituals")
        .insert({
          user_id: userId,
          title: ritual.title.slice(0, 100),
          description: (ritual.description ?? "").slice(0, 500),
          difficulty: ritual.difficulty,
          frequency: ritual.frequency,
        })
        .select("id")
        .single();
      if (error) throw error;
      idMap.set(ritual.id, data.id as string);
      ritualCount += 1;
    }

    for (const log of backup.logs) {
      const ritualId = idMap.get(log.ritualId);
      if (!ritualId || !/^\d{4}-\d{2}-\d{2}$/.test(log.date)) continue;
      const { error } = await supabase.from("ritual_logs").upsert(
        {
          ritual_id: ritualId,
          user_id: userId,
          date: log.date,
          essence_gained: Math.max(0, Number(log.essence_gained) || 0),
        },
        { onConflict: "ritual_id,date", ignoreDuplicates: true },
      );
      if (error) throw error;
      logCount += 1;
    }

    return { rituals: ritualCount, logs: logCount };
  },
};
