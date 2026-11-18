// Server-side entry point for AI ritual suggestions.
//
// This is the extension point for future AI features: the browser only calls
// this function, which authenticates the user, enforces a per-user quota
// (consume_ai_quota) and is the only place allowed to hold a provider key
// (as a Supabase secret). No model provider is wired in yet, so the function
// answers 501 until `generateSuggestions` is implemented and AI_PROVIDER is set.
import { corsHeaders, getCaller, json } from '../_shared/auth.ts'

const MAX_GOAL_LENGTH = 200
const LOCALES = new Set(['es', 'en'])

interface SuggestRequest {
  goal: string
  locale: 'es' | 'en'
}

function parseBody(value: unknown): SuggestRequest | null {
  if (!value || typeof value !== 'object') return null
  const { goal, locale } = value as Record<string, unknown>
  if (typeof goal !== 'string' || typeof locale !== 'string') return null
  const cleanGoal = goal.replace(/\s+/g, ' ').trim()
  if (
    !cleanGoal ||
    cleanGoal.length > MAX_GOAL_LENGTH ||
    !LOCALES.has(locale)
  ) {
    return null
  }
  return { goal: cleanGoal, locale: locale as SuggestRequest['locale'] }
}

/**
 * Plug a provider in here (call it with a server secret, ask for JSON in the
 * requested locale and return the raw parsed payload). The client sanitizes
 * the result again before using it.
 */
// deno-lint-ignore require-await
async function generateSuggestions(_request: SuggestRequest): Promise<unknown> {
  return null
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST')
    return json({ error: 'method_not_allowed' }, 405)

  const caller = await getCaller(request)
  if (!caller) return json({ error: 'unauthorized' }, 401)

  if (!Deno.env.get('AI_PROVIDER'))
    return json({ error: 'ai_not_configured' }, 501)

  let body: SuggestRequest | null = null
  try {
    body = parseBody(await request.json())
  } catch {
    body = null
  }
  if (!body) return json({ error: 'invalid_request' }, 400)

  const { error: quotaError } = await caller.client.rpc('consume_ai_quota')
  if (quotaError) return json({ error: 'quota_exceeded' }, 429)

  const suggestions = await generateSuggestions(body)
  if (suggestions === null) return json({ error: 'ai_not_configured' }, 501)
  return json(suggestions)
})
