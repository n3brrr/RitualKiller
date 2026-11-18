import { supabase } from '@/lib/supabase'
import type { Goal } from '@/types'

interface GoalRow {
  id: string
  user_id: string
  title: string
  description: string
  target_date: string
  target_value: number
  progress: number
  ritual_ids: string[] | null
  created_at: string
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
  }
}

export interface GoalInput {
  title: string
  description: string
  targetDate: string
  targetValue: number
  ritualIds: string[]
}

export const goalService = {
  /** Progress is computed by the goals_with_progress view. */
  async list(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('goals_with_progress')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return ((data ?? []) as GoalRow[]).map(mapGoal)
  },

  /** Creates (id null) or updates a goal and its linked rituals atomically. */
  async save(id: string | null, input: GoalInput): Promise<string> {
    const { data, error } = await supabase.rpc('save_goal', {
      p_goal_id: id,
      p_title: input.title.trim().slice(0, 120),
      p_description: input.description.trim().slice(0, 500),
      p_target_date: input.targetDate,
      p_target_value: Math.max(1, Math.floor(input.targetValue)),
      p_ritual_ids: input.ritualIds,
    })
    if (error) throw error
    return data as string
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('goals').delete().eq('id', id)
    if (error) throw error
  },
}
