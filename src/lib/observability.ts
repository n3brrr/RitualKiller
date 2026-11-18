import { supabase } from './supabase'

// Mirrors the error_logs check constraints.
const MAX_MESSAGE = 2000
const MAX_STACK = 10_000
/** At most this many reports per page session, and one per message per minute. */
const MAX_REPORTS = 20
const DEDUPE_MS = 60_000

let sent = 0
const lastSent = new Map<string, number>()

function normalizeError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return error.stack
      ? { message: error.message, stack: error.stack }
      : { message: error.message }
  }
  if (typeof error === 'string') return { message: error }
  try {
    return { message: JSON.stringify(error) }
  } catch {
    return { message: 'Unknown error' }
  }
}

/** Keeps only primitive, non-personal context values (no objects, no emails). */
function sanitizeContext(
  context: Record<string, unknown>,
): Record<string, unknown> {
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(context).slice(0, 10)) {
    if (typeof value === 'number' || typeof value === 'boolean')
      clean[key] = value
    else if (typeof value === 'string') {
      clean[key] = value
        .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[email]')
        .slice(0, 500)
    }
  }
  return clean
}

/** Decides whether a report may be sent now (rate limit + de-duplication). */
export function shouldReport(
  message: string,
  now: number = Date.now(),
): boolean {
  if (sent >= MAX_REPORTS) return false
  const previous = lastSent.get(message)
  if (previous !== undefined && now - previous < DEDUPE_MS) return false
  lastSent.set(message, now)
  sent += 1
  return true
}

/** Test helper. */
export function resetReportingState(): void {
  sent = 0
  lastSent.clear()
}

/** Best-effort error reporting. Never throws or blocks the UI. */
export function captureError(
  error: unknown,
  context: Record<string, unknown> = {},
): void {
  const normalized = normalizeError(error)
  console.error('[RitualKiller]', normalized.message, context)

  const message = normalized.message.slice(0, MAX_MESSAGE)
  if (!shouldReport(message)) return

  void supabase.auth
    .getSession()
    .then(({ data }) => {
      const userId = data.session?.user.id
      if (!userId) return
      return supabase.from('error_logs').insert({
        user_id: userId,
        message,
        stack: normalized.stack?.slice(0, MAX_STACK) ?? null,
        context: sanitizeContext(context),
      })
    })
    .catch(() => undefined)
}

export function initObservability(): void {
  window.addEventListener('error', (event) => {
    captureError(event.error ?? event.message, { source: 'window.error' })
  })
  window.addEventListener('unhandledrejection', (event) => {
    captureError(event.reason, { source: 'unhandledrejection' })
  })
}
