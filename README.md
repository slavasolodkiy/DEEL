# GlobalHR Platform

A production-grade reference HR/payroll platform (API-first, full-stack web + mobile).

## Tech Stack

| Layer | Technology |
|---|---|
| API | Node.js + Express + Drizzle ORM + PostgreSQL |
| Web | React + Vite + Tailwind CSS |
| Mobile | Expo (React Native) — iOS & Android |
| Auth | JWT (email/password) + mock OAuth + SCIM 2.0 |
| Onboarding | Config-driven state machine (individual + business journeys) |
| i18n | en / es / fr |

## Local Setup

**Prerequisites:** Node.js ≥ 22, pnpm ≥ 10

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment (copy and fill)
cp .env.example .env

# 3. Push DB schema
pnpm --filter @workspace/db run db:push

# 4. Start all services
pnpm --filter @workspace/api-server run dev   # API  → :3001
pnpm --filter @workspace/web run dev          # Web  → :3000
pnpm --filter @workspace/mobile run dev       # Expo → QR code
```

## Verification Commands

```bash
# Type-check entire monorepo
pnpm run typecheck

# Unit tests (onboarding engine)
pnpm --filter @workspace/onboarding-engine test --run

# Build validation
pnpm --filter @workspace/api-server --filter @workspace/web run build

# Security audit
pnpm audit --audit-level=high
```

## Key API Endpoints

| Method | Path | Auth |
|---|---|---|
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| GET | `/api/auth/me` | Bearer JWT |
| GET | `/api/onboarding-engine/flows` | public |
| POST | `/api/onboarding-engine/sessions` | optional JWT |
| GET | `/api/onboarding-engine/sessions/:id` | ownership |
| POST | `/api/onboarding-engine/sessions/:id/answer` | ownership + validation |
| GET | `/api/workers` | Bearer JWT |
| GET | `/api/dashboard` | Bearer JWT |
| * | `/api/auth/scim/v2/*` | SCIM token or JWT |

## Project Structure

```
artifacts/
  api-server/     Express API
  web/            React + Vite SPA
  mobile/         Expo app
lib/
  db/             Drizzle schema + migrations
  onboarding-engine/  State machine engine + unit tests
  api-zod/        Zod validators (generated from OpenAPI)
  i18n/           Translation files (en/es/fr)
scripts/
  preinstall.mjs  Cross-platform install guard
docs/
  changelog.md    Release history
  KNOWN_GAPS.md   Known limitations
```

## CI

GitHub Actions runs on every push and PR — typecheck, unit tests, build, security audit on both `ubuntu-latest` and `windows-latest`.

## Repository

https://github.com/slavasolodkiy/globalhr-platform
