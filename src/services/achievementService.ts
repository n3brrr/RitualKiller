import { supabase } from '@/lib/supabase'

interface AchievementRow {
  achievement_id: string
  unlocked_at: string
}

/** Achievements are granted by the database; the client only reads them. */
export const achievementService = {
  async listUnlocked(userId: string): Promise<Record<string, string>> {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', userId)
    if (error) throw error
    return Object.fromEntries(
      ((data ?? []) as AchievementRow[]).map((row) => [
        row.achievement_id,
        row.unlocked_at,
      ]),
    )
  },
}
