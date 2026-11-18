/** Default max rows PostgREST returns per request in Supabase. */
export const PAGE_SIZE = 1000

interface PageResult<T> {
  data: T[] | null
  error: unknown
}

/**
 * Reads every row of a query page by page, so results are never silently cut
 * at the server's row limit. `page(from, to)` must apply a stable order and
 * `.range(from, to)`.
 */
export async function fetchAllPages<T>(
  page: (from: number, to: number) => PromiseLike<PageResult<T>>,
  maxRows = 50_000,
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; from < maxRows; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1)
    if (error) throw error
    const chunk = data ?? []
    rows.push(...chunk)
    if (chunk.length < PAGE_SIZE) break
  }
  return rows
}
