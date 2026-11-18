import type { Difficulty, Frequency } from '@/types'

const BASE_REWARD: Record<Difficulty, number> = {
  novice: 10,
  adept: 25,
  master: 50,
}

/**
 * Essence per completion. Mirrors public.ritual_base_reward() in the database,
 * which is the value actually applied; the client only uses it for previews.
 */
export function ritualReward(
  difficulty: Difficulty,
  frequency: Frequency,
): number {
  return BASE_REWARD[difficulty] * (frequency === 'weekly' ? 3 : 1)
}
