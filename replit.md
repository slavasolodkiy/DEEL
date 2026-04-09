# GlobalHR Platform

## Overview

A production-grade global HR/payroll platform inspired by Deel. Full-stack monorepo with a web application, REST API, and PostgreSQL database. Manages workers (employees, contractors, EOR), contracts, payments, compliance documents, onboarding workflows, and notifications.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Web framework**: React + Vite (wouter, TanStack Query, shadcn/ui)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Styling**: Tailwind CSS v4, tw-animate-css

## Architecture

```
artifacts/
  api-server/       — Express 5 REST API (routes: health, organizations, workers, contracts, payments, compliance, onboarding, notifications, dashboard)
  web/              — React + Vite SPA (all HR module pages)
lib/
  api-spec/         — OpenAPI 3.1 specification (single source of truth)
  api-client-react/ — Generated React Query hooks (from OpenAPI via Orval)
  api-zod/          — Generated Zod schemas for server-side validation
  db/               — Drizzle ORM schema + client
```

## Domain Modules

- **Workers**: employees, contractors, EOR workers across 150+ countries
- **Contracts**: full-time, part-time, fixed-term, freelance, indefinite
- **Payments**: salary, bonus, expense, invoice runs with approval workflow
- **Compliance**: work permits, tax IDs, ID documents, background checks
- **Onboarding**: task tracking by category (documents, equipment, access, training)
- **Notifications**: system notifications with read/unread state
- **Dashboard**: aggregated metrics, payroll timeline, country distribution, recent activity

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/web run dev` — run web app locally

## Database Schema

Tables: `organizations`, `workers`, `contracts`, `payments`, `compliance_items`, `onboarding_tasks`, `notifications`

All seeded with realistic global demo data (Meridian Global org, 10 workers across 10 countries).

## API

Base URL: `/api`  
All endpoints documented in `lib/api-spec/openapi.yaml`

Key endpoint groups:
- `GET/POST /api/workers` — worker management
- `GET/POST /api/contracts` — contract management
- `POST /api/contracts/:id/sign` — sign a contract
- `GET/POST /api/payments` — payment runs
- `POST /api/payments/:id/approve` — approve payment
- `GET/POST/PATCH /api/compliance` — compliance docs
- `GET/POST/PATCH /api/onboarding` — onboarding tasks
- `GET /api/notifications` — notifications
- `POST /api/notifications/:id/read` — mark notification read
- `GET /api/dashboard/summary` — executive metrics
- `GET /api/dashboard/payroll-timeline` — 12-month payroll chart data
- `GET /api/dashboard/workers-by-country` — geographic distribution
- `GET /api/dashboard/recent-activity` — activity feed
- `GET /api/dashboard/compliance-overview` — compliance status counts

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
