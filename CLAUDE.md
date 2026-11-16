# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

pnpm 12 is the only supported package manager (Node 22+). CI runs `format:check → typecheck → lint → test → test:db → build` (`pnpm verify` runs the same locally).

```bash
pnpm dev                 # Vite dev server on localhost:3000
pnpm build               # production build
pnpm analyze             # bundle report in reports/ (never inside dist)
pnpm typecheck           # tsc --noEmit
pnpm lint                # eslint . (includes jsx-a11y and react-refresh rules)
pnpm format:check        # prettier --check .
pnpm test                # vitest run (jsdom, globals, setup in src/test/setup.ts; only src/**)
pnpm test:db             # migrations + RLS + RPC tests on PGlite (supabase/tests, no Docker)
pnpm vitest run src/utils/test/dates.test.ts        # single test file
pnpm vitest run -t "name of test"                   # single test by name
pnpm verify              # format:check + typecheck + lint + test + test:db + build
```

Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (optional `VITE_AI_ENABLED`, default `false`). Without them the app renders but authenticated features fail (`isSupabaseConfigured` in `src/lib/supabase.ts`).

## Architecture

Client-only React 19 + TypeScript SPA (Vite, Tailwind 3, React Router 7, TanStack Query). There is no custom backend: Supabase provides auth, Postgres, authorization and Edge Functions. The `@` alias maps to `src/`.

**Layering (follow it when adding a feature):**
`features/<domain>/pages/*Page.tsx` (lazy-loaded with `lazyWithRetry` in `src/App.tsx`) → `hooks/use*.ts` (TanStack Query wrappers; mutations invalidate related keys such as `rituals`, `profile`, `goals`, `achievements`, `stats`, `notifications`, keyed by `userId`) → `services/*Service.ts` (the only place that talks to `supabase`, maps DB rows to `src/types`) → Supabase. Shared UI lives in `components/` (`ui/` primitives such as `Modal`, `ConfirmDialog`, `FormField`, `ProgressBar`, `Avatar`, `ToastProvider`), pure helpers in `utils/` and static content in `data/` (achievement metrics, shop icons, quote and library keys).

**Routing/auth:** `App.tsx` defines `createBrowserRouter` with a `RootLayout` that sets `document.title` from `PAGE_TITLES` (add new routes there). `/app/*` is wrapped by `ProtectedRoute`; `/app/admin` additionally by `AdminRoute`. Session state: `features/auth/AuthProvider` + `useAuth` (in `features/auth/useAuth.ts`), which also exposes `passwordRecovery`.

**Database logic lives in SQL** (`supabase/migrations/`, applied in timestamp order; add a new migration file, never edit applied ones). The client cannot write `inventory`, `active_buffs`, `ritual_logs`, `user_achievements` or `notifications`: those are written by `SECURITY DEFINER` functions (`complete_ritual`, `undo_ritual`, `purchase_item`, `consume_item`, `save_goal`, `import_backup`, `admin_*`, `ensure_ritual_reminder`). Rewards, the today/yesterday completion window (user time zone in `user_settings.timezone`), streaks (`rituals_with_streak`), achievements (`evaluate_achievements` triggers), stats (`my_stats`) and goal progress (`goals_with_progress`) are computed server-side. Triggers that distinguish API writes use `is_api_role()` and must be `SECURITY INVOKER`. Other users are read through `public_profiles` / `get_public_profile`. Functions are not executable by `anon` by default: grant new RPCs to `authenticated` explicitly. Every security/gameplay change needs a test in `supabase/tests/`.

**Errors:** show errors with `errorMessage(error, t)` from `src/lib/errors.ts` (maps SQL exceptions, Postgres and Auth codes to translation keys; throw `AppError(key)` from our code). Quick actions report through `useToast()`. Client errors go to `error_logs` via `src/lib/observability.ts` (throttled).

**i18n:** dictionaries in `src/i18n/es.ts` (source of `TranslationKey`) and `src/i18n/en.ts` (`Record<TranslationKey, string>`, so every key must exist in both). Use `t(key, params)` with `{placeholders}` and `tn(key, count)` for plurals (`<key>.one` / `<key>.other`); never concatenate translated fragments. Notifications from the server carry `type` + `data` and are translated by `utils/notificationText.ts`. The provider lives in `src/i18n/I18nProvider.tsx`.

**AI:** disabled by default. `src/services/ai/` defines the `AiProvider` interface; real model calls must go through the authenticated `supabase/functions/ai-suggest-rituals` Edge Function (quota via `consume_ai_quota`). Never call a model or put provider keys in the browser.

**Deployment:** Vercel (`vercel.json`) or Docker (`Dockerfile` + `docker/nginx.conf` + `docker/security-headers.conf`, unprivileged nginx on :8080 with CSP/HSTS and no-cache `index.html`). Edge Functions: `delete-account` (required) and `ai-suggest-rituals`. See `supabase/README.md` for Auth dashboard settings.

## Conventions

- Tests live next to code (`*.test.ts`) or in `test/` subfolders; DB tests live in `supabase/tests/`.
- Commit style is conventional commits with scope (e.g. `feat(ui): ...`, `fix(a11y): ...`).
- Files use LF line endings (`.gitattributes`); run `pnpm format` before committing.
- `features.md` is the audit report with the status of every finding.
- `docs/superpowers/` contains design specs/plans; `.opencode/` and `.superpowers/` are tooling folders.
