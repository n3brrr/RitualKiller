import type { TranslationKey } from '@/i18n'
import type { Difficulty, Frequency } from '@/types'

export type RitualCategory =
  | 'health'
  | 'productivity'
  | 'mental'
  | 'physical'
  | 'social'
  | 'learning'
  | 'creativity'
  | 'spiritual'

/**
 * Suggested ritual. Title and description are translated
 * (library.<id>.title / .description); the reward is computed from the
 * difficulty and frequency exactly like the database does.
 */
export interface RitualTemplate {
  id: string
  difficulty: Difficulty
  category: RitualCategory
  frequency: Frequency
  tags: string[]
  popular?: boolean
}

// prettier-ignore
export const RITUAL_LIBRARY: RitualTemplate[] = [
  { id: "lib-health-1", difficulty: "novice", category: "health", frequency: "daily", tags: ["health", "hydration", "morning"], popular: true },
  { id: "lib-health-2", difficulty: "adept", category: "health", frequency: "daily", tags: ["health", "discipline", "cold"], popular: true },
  { id: "lib-health-3", difficulty: "adept", category: "health", frequency: "daily", tags: ["health", "exercise", "walking"] },
  { id: "lib-prod-1", difficulty: "adept", category: "productivity", frequency: "daily", tags: ["productivity", "concentration", "work"], popular: true },
  { id: "lib-prod-2", difficulty: "master", category: "productivity", frequency: "daily", tags: ["productivity", "discipline", "morning"], popular: true },
  { id: "lib-prod-3", difficulty: "adept", category: "productivity", frequency: "daily", tags: ["productivity", "discipline", "digital"] },
  { id: "lib-mental-1", difficulty: "novice", category: "mental", frequency: "daily", tags: ["mental", "meditation", "mindfulness"], popular: true },
  { id: "lib-mental-2", difficulty: "novice", category: "mental", frequency: "daily", tags: ["mental", "gratitude", "writing"] },
  { id: "lib-mental-3", difficulty: "adept", category: "mental", frequency: "daily", tags: ["mental", "sleep", "digital"] },
  { id: "lib-physical-1", difficulty: "adept", category: "physical", frequency: "daily", tags: ["physical", "exercise", "strength"] },
  { id: "lib-physical-2", difficulty: "master", category: "physical", frequency: "daily", tags: ["physical", "exercise", "core"] },
  { id: "lib-learning-1", difficulty: "novice", category: "learning", frequency: "daily", tags: ["learning", "reading", "knowledge"], popular: true },
  { id: "lib-learning-2", difficulty: "adept", category: "learning", frequency: "daily", tags: ["learning", "programming", "skills"] },
  { id: "lib-creativity-1", difficulty: "novice", category: "creativity", frequency: "daily", tags: ["creativity", "art", "expression"] },
  { id: "lib-spiritual-1", difficulty: "novice", category: "spiritual", frequency: "daily", tags: ["spiritual", "reflection", "growth"] },
]

type Translate = (key: TranslationKey) => string

export function templateText(
  template: Pick<RitualTemplate, 'id'>,
  t: Translate,
): { title: string; description: string } {
  return {
    title: t(`library.${template.id}.title` as TranslationKey),
    description: t(`library.${template.id}.description` as TranslationKey),
  }
}

export interface LibraryFilters {
  query: string
  popularOnly: boolean
  category: RitualCategory | 'all'
  difficulty: Difficulty | 'all'
}

/** All filters combine (searching no longer ignores "popular only"). */
export function filterTemplates(
  templates: RitualTemplate[],
  filters: LibraryFilters,
  t: Translate,
): RitualTemplate[] {
  const query = filters.query.trim().toLowerCase()
  return templates.filter((template) => {
    if (filters.popularOnly && !template.popular) return false
    if (filters.category !== 'all' && template.category !== filters.category)
      return false
    if (
      filters.difficulty !== 'all' &&
      template.difficulty !== filters.difficulty
    ) {
      return false
    }
    if (!query) return true
    const { title, description } = templateText(template, t)
    return [title, description, ...template.tags].some((text) =>
      text.toLowerCase().includes(query),
    )
  })
}
