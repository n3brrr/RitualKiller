import type { Difficulty } from '@/types'
import type { RitualSuggestion } from './types'

const DIFFICULTIES: readonly Difficulty[] = ['novice', 'adept', 'master']
export const MAX_SUGGESTIONS = 5
export const MAX_GOAL_LENGTH = 200

/**
 * Model output is untrusted input: accept either an array or `{ rituals: [...] }`,
 * keep only well-formed items, clamp lengths to the database limits and default
 * unknown difficulties to "novice".
 */
export function sanitizeSuggestions(value: unknown): RitualSuggestion[] {
  const list = Array.isArray(value)
    ? value
    : value &&
        typeof value === 'object' &&
        Array.isArray((value as { rituals?: unknown }).rituals)
      ? (value as { rituals: unknown[] }).rituals
      : []

  return list
    .map((item): RitualSuggestion | null => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const title =
        typeof record.title === 'string'
          ? record.title.trim().slice(0, 100)
          : ''
      if (!title) return null
      const description =
        typeof record.description === 'string'
          ? record.description.trim().slice(0, 500)
          : ''
      const difficulty = DIFFICULTIES.includes(record.difficulty as Difficulty)
        ? (record.difficulty as Difficulty)
        : 'novice'
      return { title, description, difficulty }
    })
    .filter((item): item is RitualSuggestion => item !== null)
    .slice(0, MAX_SUGGESTIONS)
}

/** Extracts the first JSON array or object from free-form model text. */
export function parseSuggestionsText(text: string): RitualSuggestion[] {
  const match = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/)
  if (!match) return []
  try {
    return sanitizeSuggestions(JSON.parse(match[0]))
  } catch {
    return []
  }
}

/** Normalises the user goal before it is sent to any provider. */
export function normalizeGoal(goal: string): string {
  return goal.replace(/\s+/g, ' ').trim().slice(0, MAX_GOAL_LENGTH)
}
