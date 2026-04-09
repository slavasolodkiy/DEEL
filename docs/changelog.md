# Changelog

All notable changes to GlobalHR Platform are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

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
