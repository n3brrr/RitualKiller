import { describe, expect, it } from 'vitest'
import {
  MAX_SUGGESTIONS,
  normalizeGoal,
  parseSuggestionsText,
  sanitizeSuggestions,
} from '../sanitize'
import { disabledProvider, getAiProvider, AiUnavailableError } from '..'

describe('AI suggestion sanitizing', () => {
  it('keeps valid items, trims values and defaults unknown difficulty', () => {
    expect(
      sanitizeSuggestions([
        {
          title: '  Dawn run  ',
          description: 'Run before sunrise',
          difficulty: 'adept',
        },
        { title: '', description: 'invalid', difficulty: 'master' },
        { title: 'Void', description: 42, difficulty: 'impossible' },
        null,
      ]),
    ).toEqual([
      {
        title: 'Dawn run',
        description: 'Run before sunrise',
        difficulty: 'adept',
      },
      { title: 'Void', description: '', difficulty: 'novice' },
    ])
  })

  it('accepts the { rituals: [...] } shape and caps the list', () => {
    const rituals = Array.from({ length: 10 }, (_, index) => ({
      title: `R${index}`,
    }))
    expect(sanitizeSuggestions({ rituals })).toHaveLength(MAX_SUGGESTIONS)
  })

  it('clamps lengths to the database limits', () => {
    const [item] = sanitizeSuggestions([
      { title: 'x'.repeat(300), description: 'y'.repeat(900) },
    ])
    expect(item?.title).toHaveLength(100)
    expect(item?.description).toHaveLength(500)
  })

  it('extracts JSON from prose and survives malformed output', () => {
    expect(parseSuggestionsText('Sure: [{"title":"Read"}] enjoy')).toEqual([
      { title: 'Read', description: '', difficulty: 'novice' },
    ])
    expect(parseSuggestionsText('no json here')).toEqual([])
    expect(parseSuggestionsText('[{broken')).toEqual([])
  })

  it('normalises the goal', () => {
    expect(normalizeGoal('  learn   piano \n daily ')).toBe('learn piano daily')
    expect(normalizeGoal('a'.repeat(300))).toHaveLength(200)
  })
})

describe('AI provider selection', () => {
  it('is disabled unless the feature flag is on', async () => {
    expect(getAiProvider()).toBe(disabledProvider)
    expect(disabledProvider.available).toBe(false)
    await expect(
      disabledProvider.suggestRituals({ goal: 'x', locale: 'es' }),
    ).rejects.toBeInstanceOf(AiUnavailableError)
  })
})
