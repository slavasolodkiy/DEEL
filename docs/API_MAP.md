# API Map

## Overview

All endpoints under `/api`. Production base: `https://api.globalhr-platform.dev/rest/v2` (hypothetical).
Auth via `Authorization: Bearer <token>` header.

---

## Service Boundaries

```
Client (Web / Mobile)
        │
        ▼
   Express BFF / Gateway  (artifacts/api-server)
        │
        ├── /api/auth/*           — Auth Service
        ├── /api/onboarding-engine/*  — Onboarding Engine Service
        ├── /api/workers/*        — Workers Service
        ├── /api/contracts/*      — Contracts Service
        ├── /api/payments/*       — Payments Service
        ├── /api/compliance/*     — Compliance Service
        ├── /api/onboarding/*     — Onboarding Tasks (legacy HR module)
        ├── /api/notifications/*  — Notifications Service
        ├── /api/dashboard/*      — Dashboard Aggregation Service
        ├── /api/organizations/*  — Organizations Service
        └── /api/healthz          — Health Check
```

---

## Auth Service — `/api/auth`

Full OpenAPI spec: `openapi/auth.yaml`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Create account (email/password + role) |
| POST | `/api/auth/login` | None | Login, receive JWT |
| POST | `/api/auth/logout` | Bearer | Revoke current session |
| GET | `/api/auth/me` | Bearer | Get current user |
| GET | `/api/auth/oauth/:provider` | None | Mock OAuth login (google, github) |
| POST | `/api/auth/sso/callback` | None | Mock SAML/OIDC SSO callback |
| GET | `/api/auth/scim/v2/Users` | Bearer | SCIM 2.0 — list users |
| POST | `/api/auth/scim/v2/Users` | Bearer | SCIM 2.0 — provision user |
| GET | `/api/auth/scim/v2/Users/:id` | Bearer | SCIM 2.0 — get user |
| PATCH | `/api/auth/scim/v2/Users/:id` | Bearer | SCIM 2.0 — update user |
| DELETE | `/api/auth/scim/v2/Users/:id` | Bearer | SCIM 2.0 — deprovision user |

### Auth Notes
- JWT signed with `JWT_SECRET` env var (falls back to `SESSION_SECRET`)
- Token TTL: 24 hours
- Sessions stored in `auth_sessions` table for revocation support
- OAuth adapter: mock only — returns real JWT for test user
- SAML adapter: mock only — accepts any email, creates/fetches user
- SCIM adapter: real CRUD against `users` table (no IdP sync in this impl)

---

## Onboarding Engine Service — `/api/onboarding-engine`

Full OpenAPI spec: `openapi/onboarding-engine.yaml`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/onboarding-engine/flows` | None | List flow summaries (id, version, titleKey) |
| GET | `/api/onboarding-engine/flows/:flowId` | None | Get full flow config |
| POST | `/api/onboarding-engine/sessions` | Optional | Start new onboarding session |
| GET | `/api/onboarding-engine/sessions/:id` | None | Get session state + current step |
| POST | `/api/onboarding-engine/sessions/:id/answer` | None | Submit answers for current step |
| POST | `/api/onboarding-engine/sessions/:id/back` | None | Navigate to previous step |

### Engine Notes
- Sessions are anonymous (userId optional) — supports pre-login onboarding
- State persisted in PostgreSQL `onboarding_sessions` table
- Step history in `onboarding_step_log`
- Engine is pure TypeScript — no external service calls

---

## Workers Service — `/api/workers`

| Method | Path | Description |
|---|---|---|
| GET | `/api/workers` | List all workers (filterable by status, type) |
| POST | `/api/workers` | Create a new worker |
| GET | `/api/workers/:id` | Get worker by ID |
| PATCH | `/api/workers/:id` | Update worker |
| DELETE | `/api/workers/:id` | Delete worker |

---

## Contracts Service — `/api/contracts`

| Method | Path | Description |
|---|---|---|
| GET | `/api/contracts` | List contracts |
| POST | `/api/contracts` | Create contract |
| GET | `/api/contracts/:id` | Get contract |
| PATCH | `/api/contracts/:id` | Update contract |
| POST | `/api/contracts/:id/sign` | Sign a contract |
| DELETE | `/api/contracts/:id` | Delete contract |

---

## Payments Service — `/api/payments`

| Method | Path | Description |
|---|---|---|
| GET | `/api/payments` | List payment runs |
| POST | `/api/payments` | Create payment run |
| GET | `/api/payments/:id` | Get payment run |
| POST | `/api/payments/:id/approve` | Approve a payment run |

---

## Compliance Service — `/api/compliance`

| Method | Path | Description |
|---|---|---|
| GET | `/api/compliance` | List compliance items |
| POST | `/api/compliance` | Create compliance item |
| GET | `/api/compliance/:id` | Get compliance item |
| PATCH | `/api/compliance/:id` | Update compliance item status |

---

## Onboarding Tasks Service — `/api/onboarding` (HR module)

| Method | Path | Description |
|---|---|---|
| GET | `/api/onboarding` | List onboarding tasks |
| POST | `/api/onboarding` | Create onboarding task |
| PATCH | `/api/onboarding/:id` | Update task status |

---

## Notifications Service — `/api/notifications`

| Method | Path | Description |
|---|---|---|
| GET | `/api/notifications` | List notifications |
| POST | `/api/notifications/:id/read` | Mark notification as read |
| POST | `/api/notifications/read-all` | Mark all as read |

---

## Dashboard Service — `/api/dashboard`

| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard/summary` | Executive KPI summary |
| GET | `/api/dashboard/payroll-timeline` | 12-month payroll chart data |
| GET | `/api/dashboard/workers-by-country` | Geographic distribution |
| GET | `/api/dashboard/recent-activity` | Activity feed |
| GET | `/api/dashboard/compliance-overview` | Compliance status counts |

---

## Organizations Service — `/api/organizations`

| Method | Path | Description |
|---|---|---|
| GET | `/api/organizations` | List organizations |
| POST | `/api/organizations` | Create organization |
| GET | `/api/organizations/:id` | Get organization |
| PATCH | `/api/organizations/:id` | Update organization |

---

## Health — `/api/healthz`

| Method | Path | Description |
|---|---|---|
| GET | `/api/healthz` | Returns `{ status: "ok" }` |

---

## Response Conventions

- All responses: `Content-Type: application/json`
- Success: `2xx` with data object or array
- Error: `{ error: string, message: string }` with appropriate `4xx` or `5xx`
- Lists: plain arrays (no pagination envelope yet — see KNOWN_GAPS.md)
- Timestamps: ISO 8601 strings with timezone

## Rate Limiting

Not yet implemented. See KNOWN_GAPS.md.
