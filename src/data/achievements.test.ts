import { describe, expect, it } from 'vitest'
import { ACHIEVEMENTS, EMPTY_STATS, achievementProgress } from './achievements'

function achievement(id: string) {
  const found = ACHIEVEMENTS.find((item) => item.id === id)
  if (!found) throw new Error(`Missing achievement ${id}`)
  return found
}

describe('achievement progress', () => {
  it('reads the metric of each achievement and caps it at the target', () => {
    const stats = { ...EMPTY_STATS, best_streak: 9, completions: 42 }
    expect(achievementProgress(achievement('ach-streak-7'), stats)).toBe(7)
    expect(achievementProgress(achievement('ach-streak-30'), stats)).toBe(9)
    expect(achievementProgress(achievement('ach-complete-100'), stats)).toBe(42)
  })

  it('uses lifetime essence, which does not drop when spending', () => {
    expect(
      achievementProgress(achievement('ach-essence-1000'), {
        ...EMPTY_STATS,
        lifetime_essence: 1500,
      }),
    ).toBe(1000)
  })

  it('treats missing or invalid stats as zero', () => {
    expect(achievementProgress(achievement('ach-social-first'), {})).toBe(0)
    expect(
      achievementProgress(achievement('ach-social-first'), {
        posts: Number.NaN,
      }),
    ).toBe(0)
  })

  it('has unique ids and positive targets', () => {
    const ids = ACHIEVEMENTS.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ACHIEVEMENTS.every((item) => item.target > 0)).toBe(true)
  })
})
