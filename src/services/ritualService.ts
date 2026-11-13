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
  essence_reward: number;
  created_at: string;
}

interface LogRow {
  id: string;
  ritual_id: string;
  user_id: string;
  date: string;
  essence_gained: number;
}

export interface RitualBundle {
  rituals: Ritual[];
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
  essenceReward: number;
}

function mapRitual(row: RitualRow): Ritual {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    difficulty: row.difficulty,
    frequency: row.frequency,
    streak: row.streak,
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
  };
}

export const ritualService = {
  async list(userId: string): Promise<RitualBundle> {
    const [ritualsResult, logsResult] = await Promise.all([
      supabase
        .from("rituals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("ritual_logs")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: true }),
    ]);

    if (ritualsResult.error) throw ritualsResult.error;
    if (logsResult.error) throw logsResult.error;

    return {
      rituals: ((ritualsResult.data ?? []) as RitualRow[]).map(mapRitual),
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
        essence_reward: input.essenceReward,
      })
      .select("*")
      .single();
    if (error) throw error;
    return mapRitual(data as RitualRow);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("rituals").delete().eq("id", id);
    if (error) throw error;
  },

  async complete(id: string, date: string): Promise<CompleteResult> {
    const { data, error } = await supabase.rpc("complete_ritual", {
      p_ritual_id: id,
      p_date: date,
    });
    if (error) throw error;
    return data as CompleteResult;
  },

  async undo(id: string, date: string): Promise<CompleteResult> {
    const { data, error } = await supabase.rpc("undo_ritual", {
      p_ritual_id: id,
      p_date: date,
    });
    if (error) throw error;
    return data as CompleteResult;
  },

  /** Re-inserts a backup under the current account, remapping ritual ids. */
  async importBackup(userId: string, backup: ExportData): Promise<{ rituals: number; logs: number }> {
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
          essence_reward: Math.min(1000, Math.max(0, ritual.essenceReward)),
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
