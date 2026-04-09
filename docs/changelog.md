# Changelog

All notable changes to GlobalHR Platform are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Added
- Root `README.md` with local setup, verification commands, and API reference table
- `docs/KNOWN_GAPS.md` (existing) updated with security and test gap resolutions
- **`sessionAccessTokenHash` column** added to `onboarding_sessions` table — stores SHA-256 hash of anonymous session token; plain-text token never persisted

### Security
- **Auth middleware** (`middlewares/auth.ts`): reusable `requireAuth`, `optionalAuth`, `requireScimToken` middleware
- **Fail-fast JWT_SECRET** (`middlewares/auth.ts`): server throws `Error` at startup if neither `JWT_SECRET` nor `SESSION_SECRET` is set — no silent fallback to a hardcoded string
- **DB-backed session validation** (`requireAuth`): every authenticated request queries `auth_sessions` and rejects if session is missing, `isRevoked = true`, or `expiresAt ≤ now` — JWT alone is no longer sufficient
- **Shared JWT_SECRET constant**: `routes/auth.ts` imports `JWT_SECRET` from `middlewares/auth` — single source of truth, no redundant fallback
- **Route protection**: all non-public API routes now require Bearer JWT via `requireAuth`; SCIM routes guarded with `requireScimToken`
- **Anonymous onboarding session tokens**: `POST /sessions` returns a one-time 256-bit `sessionAccessToken` for unauthenticated sessions; subsequent GET/POST/back calls must include the plain token in `X-Onboarding-Session-Token` header; only the SHA-256 hash is stored in DB
- **Authenticated session ownership**: `GET/POST /sessions/:id`, `/answer`, `/back` return 403 when authenticated user ID does not match `sessions.userId`
- **userId injection**: session creation ignores `userId` from request body; identity derived from JWT token

### Changed
- **Onboarding server-side validation**: `POST /sessions/:id/answer` validates required fields before advancing; returns `400` with structured `{ error, message, fields[] }` payload
- **Build reliability**: removed duplicate `export * from "./generated/types"` from `lib/api-zod/src/index.ts`; `pnpm -w run typecheck` now passes clean across all 5 packages
- **Cross-platform install**: `preinstall` script replaced from Unix-only `sh -c` with `node scripts/preinstall.mjs`
- **Rollup overrides**: removed `win32-arm64-msvc`, `win32-ia32-msvc`, `win32-x64-gnu`, `win32-x64-msvc` exclusions from `pnpm-workspace.yaml` so Windows CI can install correctly
- **CI workflow** (`.github/workflows/ci.yml`): matrix runs on `ubuntu-latest` and `windows-latest`; steps: install, typecheck, unit tests, build, security audit

### Fixed
- `contracts.ts`: `startDate` (Date) and `compensation` (number) coerced to strings before Drizzle insert/update
- `workers.ts`: `salary` (number) coerced to string for Drizzle numeric column
- `payments.ts`: `amount` (number) coerced to string for Drizzle numeric column
- `auth.ts` + `middlewares/auth.ts`: JWT `verify()` result properly double-cast via `as unknown as { sub: number }`
- Mobile `workers.tsx`, `payments.tsx`: `headers` typed as `Record<string, string>` to fix `Authorization?: undefined` compile error
- Mobile `profile.tsx`, `index.tsx`, `payments.tsx`: `Parameters<typeof Feather>` replaced with `React.ComponentProps<typeof Feather>` to fix `never` type under strict mode
- Web pages: `{}` replaced with `undefined` for missing filter params; queryKey status values cast to enum types; `ChevronLeft` import added to `step-renderer.tsx`
- UI components: `button-group.tsx` element type cast; `calendar.tsx` ref + props casts; `spinner.tsx` switched to `LucideProps` — `pnpm -w run typecheck` clean across web + mockup-sandbox

### Tests
- **16 new unit tests** in `artifacts/api-server/src/__tests__/`:
  - `auth-middleware.test.ts` (7 tests): no token → 401, invalid JWT → 401, expired JWT → 401, session not found → 401, session revoked → 401, session expired → 401, live session → passes
  - `onboarding-session-security.test.ts` (9 tests): missing token → 401, wrong token → 401, correct token → granted, wrong user → 403, owner → granted, hash consistency, hash uniqueness
- Previous: 34 tests in `lib/onboarding-engine`; **total now: 50 unit tests, all passing**

---

## [0.3.5-ci] — 2026-04-09 · CI + GitHub Publishing

### Added
- GitHub Actions CI pipeline (typecheck, unit tests, API build, web build, security audit)
- Draft PR #1: `feature/auth-onboarding-mobile` → `main`
  - **Repository:** https://github.com/slavasolodkiy/globalhr-platform
  - **PR:** https://github.com/slavasolodkiy/globalhr-platform/pull/1
  - **CI:** https://github.com/slavasolodkiy/globalhr-platform/actions

---

## [0.3.0] — 2026-04-09 · Auth, Onboarding Engine, i18n, Mobile

### Added
- **Auth system** — email/password registration + login, JWT sessions, `/api/auth/*` routes
- **Mock OAuth / SSO** — `/api/auth/oauth/google` and `/api/auth/oauth/github` mock flows
- **SCIM adapter** — `/api/scim/v2/*` endpoints for user provisioning (mock)
- **Onboarding state machine** — config-driven branching engine (`lib/onboarding-engine`)
  - Operators: `eq`, `neq`, `in`, `not_in`, `exists`, `not_exists`
  - Flow configs: `individual-v1.json`, `business-v1.json`
  - Registry with static JSON imports (esbuild-safe)
- **Onboarding API** — `/api/onboarding-engine/*` routes (sessions, answer, back, complete)
- **i18n library** — `lib/i18n` with translations for English, Spanish, French
- **Web auth pages** — Login and Register pages with enterprise green theme
- **Web onboarding UI** — Branch-aware multi-step flow (individual + business journeys)
- **Expo mobile app** — iOS/Android app with:
  - JWT auth (AsyncStorage persistence, `/login`, `/register` screens)
  - Dashboard tab with live metrics (workers, payroll MTD, compliance alerts)
  - Workers tab with searchable list, type badges, status indicators
  - Payments tab with status badges and disbursed total card
  - Profile tab with account info, settings menu, and sign-out
  - Enterprise green theme, Feather icons, SF Symbols on iOS
- **24 unit tests** — full coverage of onboarding engine rules and state machine
- **OpenAPI specs** — 4 spec files in `/openapi`
- **Documentation** — `ONBOARDING_ENGINE.md`, `API_MAP.md`, `INTEGRATIONS.md`, `KNOWN_GAPS.md`

### Changed
- API server routes wired to include auth and onboarding-engine routers
- Web `App.tsx` updated with `/login`, `/register`, `/onboard` routes + `AuthProvider` + i18n init

---

## [0.2.0] — 2026-04-08 · HR API, Web Dashboard, Data Models

### Added
- **Database schema** — 18 tables: organizations, workers, contracts, payments, compliance, onboarding, notifications, auth_sessions
- **Workers API** — CRUD `/api/workers/*` with filtering and pagination
- **Contracts API** — `/api/contracts/*` with status management
- **Payments API** — `/api/payments/*` with multi-currency support
- **Compliance API** — `/api/compliance/*` with alert tracking
- **Dashboard API** — summary, recent activity, charts endpoints
- **Organizations API** — multi-tenant foundation
- **Notifications API** — `/api/notifications/*`
- **Web app** — React + Vite with enterprise green sidebar, dark mode toggle
  - Dashboard with metrics, payroll timeline, worker distribution charts
  - Workers, Contracts, Payments, Compliance, Onboarding, Settings pages
  - shadcn/ui components throughout

### Changed
- API server restructured with dedicated route modules

---

## [0.1.0] — 2026-04-07 · Initial Scaffold

### Added
- **Monorepo** — pnpm workspaces with `artifacts/` and `lib/` structure
- **API server** — Fastify + Drizzle ORM + PostgreSQL + esbuild
- **Web scaffold** — React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Mockup sandbox** — isolated component preview server
- **Research docs** — platform architecture analysis, onboarding question tree, country/language matrix, integration API matrix
- **Shared tsconfig** and workspace conventions
