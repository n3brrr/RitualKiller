import { describe, expect, it } from 'vitest'
import { isChunkLoadError } from './lazyWithRetry'

describe('isChunkLoadError', () => {
  it('recognises stale chunk errors from different browsers', () => {
    expect(
      isChunkLoadError(
        new TypeError('Failed to fetch dynamically imported module: /a.js'),
      ),
    ).toBe(true)
    expect(
      isChunkLoadError(new Error('Importing a module script failed.')),
    ).toBe(true)
    expect(isChunkLoadError(new Error('Something else'))).toBe(false)
    expect(isChunkLoadError(null)).toBe(false)
  })
})
