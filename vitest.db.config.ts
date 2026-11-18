import { defineConfig } from 'vitest/config'

// Database tests: apply every migration to an in-process Postgres (PGlite)
// and exercise RLS policies and RPC functions as real API roles.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['supabase/tests/**/*.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 120_000,
    pool: 'forks',
  },
})
