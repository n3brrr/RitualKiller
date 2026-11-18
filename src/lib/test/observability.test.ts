import { beforeEach, describe, expect, it } from 'vitest'
import { resetReportingState, shouldReport } from '../observability'

describe('error reporting limits', () => {
  beforeEach(() => resetReportingState())

  it('de-duplicates the same message within a minute', () => {
    expect(shouldReport('boom', 0)).toBe(true)
    expect(shouldReport('boom', 30_000)).toBe(false)
    expect(shouldReport('boom', 61_000)).toBe(true)
  })

  it('caps the number of reports per session', () => {
    const results = Array.from({ length: 25 }, (_, index) =>
      shouldReport(`e${index}`, 0),
    )
    expect(results.filter(Boolean)).toHaveLength(20)
  })
})
