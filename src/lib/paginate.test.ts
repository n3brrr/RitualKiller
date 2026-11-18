import { describe, expect, it, vi } from 'vitest'
import { PAGE_SIZE, fetchAllPages } from './paginate'

describe('fetchAllPages', () => {
  it('keeps requesting pages until a short page arrives', async () => {
    const total = PAGE_SIZE * 2 + 5
    const page = vi.fn(async (from: number, to: number) => ({
      data: Array.from(
        { length: Math.max(0, Math.min(to, total - 1) - from + 1) },
        (_, i) => from + i,
      ),
      error: null,
    }))
    const rows = await fetchAllPages(page)
    expect(rows).toHaveLength(total)
    expect(page).toHaveBeenCalledTimes(3)
  })

  it('propagates errors', async () => {
    await expect(
      fetchAllPages(async () => ({ data: null, error: new Error('boom') })),
    ).rejects.toThrow('boom')
  })
})
