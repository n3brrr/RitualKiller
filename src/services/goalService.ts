import { supabase } from "@/lib/supabase";
import type { Goal } from "@/types";

interface GoalRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  target_date: string;
  target_value: number;
  progress: number;
  ritual_ids: string[];
  created_at: string;
}

function mapGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    target_date: row.target_date,
    target_value: row.target_value,
    progress: row.progress,
    ritual_ids: row.ritual_ids ?? [],
    created_at: row.created_at,
  };
}

export interface CreateGoalInput {
  title: string;
  description: string;
  targetDate: string;
  targetValue: number;
  ritualIds: string[];
}

export const goalService = {
  async list(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as GoalRow[]).map(mapGoal);
  },

  async create(userId: string, input: CreateGoalInput): Promise<Goal> {
    const { data, error } = await supabase
      .from("goals")
      .insert({
        user_id: userId,
        title: input.title.trim().slice(0, 120),
        description: input.description.trim().slice(0, 500),
        target_date: input.targetDate,
        target_value: Math.max(1, Math.floor(input.targetValue)),
        ritual_ids: input.ritualIds,
      })
      .select("*")
      .single();
    if (error) throw error;
    return mapGoal(data as GoalRow);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (error) throw error;
  },
};
