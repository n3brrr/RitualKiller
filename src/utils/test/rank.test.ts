import { describe, expect, it } from 'vitest'
import { getRank } from '../rank'

describe('getRank', () => {
  it('returns the rank band for the essence', () => {
    expect(getRank(0)).toEqual({ title: 'Initiate', current: 0, next: 100 })
    expect(getRank(1850)).toEqual({
      title: 'Warlock',
      current: 1000,
      next: 2500,
    })
    expect(getRank(99999).title).toBe('Demi-God')
  })
})
