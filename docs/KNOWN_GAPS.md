# Known Gaps & Assumptions

This document tracks every assumption made where public evidence was incomplete, and every feature that is deliberately excluded from the MVP scope.

---

## Category 1: Security & Production Hardening

| Gap | Description | Assumed / Deferred |
|---|---|---|
| JWT secret management | `JWT_SECRET` falls back to `SESSION_SECRET`. In production, use a dedicated, rotated secret. | Assumed: dev environment |
| HTTPS enforcement | No TLS termination in the app layer. Assumed handled by reverse proxy/load balancer. | Deferred |
| Rate limiting | No rate limiting on auth or onboarding endpoints. Required in production. | Deferred |
| CSRF protection | No CSRF tokens on state-mutating endpoints. Required if cookies are used for auth. | Deferred |
| Input sanitization | Basic Zod validation on some routes; not complete across all endpoints. | Partial |
| Audit log | No structured audit trail for admin actions. Enterprise plans typically require this. | Deferred |
| Data encryption at rest | DB columns not encrypted at application layer (PostgreSQL's native encryption assumed). | Assumed |

---

## Category 2: Auth Adapters (Mocks, Not Production-Ready)

| Gap | Description |
|---|---|
| OAuth 2.0 | Current implementation is a mock that generates a test user directly. No real OAuth2 redirect flow is implemented. |
| SAML 2.0 | SAML callback accepts any email payload. No XML signature validation, no IdP certificate verification. |
| OIDC | OIDC discovery / JWKS endpoint not implemented. |
| MFA | Multi-factor authentication not implemented. |
| Token refresh | JWT tokens have fixed 24h TTL. No refresh token flow. |
| SCIM Groups | SCIM 2.0 Groups resource not implemented (only Users). |
| SCIM filter parsing | SCIM filter query param ignored in list endpoint. |
| Password reset | No forgot-password / reset-password flow. |
| Email verification | `isVerified` flag exists but no email verification flow is implemented. |

---

## Category 3: Onboarding Engine

| Gap | Description |
|---|---|
| Country-specific document rules | Document checklist varies per country. Current flow has a generic document upload step. Country-specific rules not yet implemented. |
| GDPR EU-country detection | `gdpr_consent` step uses `EU_GDPR` as a placeholder value. Real implementation should check against a list of EU country codes. |
| Employment quote calculation | EOR quote step shows no real cost breakdown (employer cost + statutory benefits). Requires a country-cost database or integration. |
| Salary validation | No min/max salary validation per country. |
| Milestone/task-based contract | Milestone contract type captured in onboarding but not connected to milestone tracking module. |
| Anonymous → authenticated session migration | Sessions can be started anonymous, but userId is not automatically linked after registration in the same session. |
| Session expiry | No TTL on onboarding sessions. In production, sessions should expire after N days of inactivity. |
| File upload | Document upload step renders the UI but does not upload to object storage. |

---

## Category 4: Payments & Payroll

| Gap | Description |
|---|---|
| Payment rails | No actual fund transfer initiated. Payment runs are modeled in DB only. |
| Payroll tax calculation | Tax amounts not calculated. Platform records gross salary only. |
| Multi-currency conversion | Exchange rates not applied. All amounts stored as-is. |
| Bank account validation | No IBAN/routing number validation. |
| Escrow / prefunding | No escrow model for EOR prefunding. |
| Payslip generation | Payslip PDF generation not implemented. |
| Withdrawal methods | Wise, Payoneer, crypto integrations are UI-only — no API calls made. |

---

## Category 5: Compliance & Legal

| Gap | Description |
|---|---|
| Contract template engine | Contracts are created with static status/type data. No jurisdiction-specific contract generation. |
| E-signature | Contract signing sets `status = active` in DB but does not use a real e-signature provider (DocuSign, HelloSign, etc.). |
| KYC (Veriff) | KYC step is a mock UI. No Veriff SDK, no actual liveness check. |
| Background checks | No background check provider integrated. |
| Immigration | Immigration module referenced in API docs but not built. |
| Beneficial ownership | Shareholder verification for entity contractors captured in flow but not stored distinctly. |
| Local employment contracts | No auto-generation of employment agreements per jurisdiction. |

---

## Category 6: Infrastructure

| Gap | Description |
|---|---|
| Redis | Not provisioned. Session cache, job queues, and rate limiting would require Redis. |
| Job queues | No background job processing for payroll runs, notifications, email, webhooks. |
| Email service | No email sent (verification, welcome, payroll receipts, contract invites). |
| Object storage | No S3/GCS bucket for document storage. File uploads are UI-only. |
| Webhooks (outbound) | No webhook delivery system for external integrations. |
| Search | No full-text search on workers/contracts. |
| Caching | No Redis cache layer on hot endpoints. |
| Pagination | API list endpoints return all records. No pagination envelope. |
| Sorting/filtering | Limited server-side filtering on list endpoints. |

---

## Category 7: Mobile

| Gap | Description |
|---|---|
| Mobile app | Expo mobile app scaffolded but requires onboarding flow UI completion. |
| Push notifications | No APNs/FCM integration. |
| Offline mode | No offline-first data sync. |
| Biometric login | Face ID / fingerprint not implemented in mobile. |
| Deep linking | No universal links / app scheme configured. |

---

## Category 8: i18n

| Gap | Description |
|---|---|
| RTL language support | No right-to-left layout support (Arabic, Hebrew). |
| Date/number locale formatting | No Intl.DateTimeFormat or Intl.NumberFormat applied per locale. |
| Pluralization | i18next pluralization rules not configured. |
| Currency display per locale | Amounts shown in raw numeric form, not locale-formatted. |
| Language auto-detection | Language derived from user.locale only; no browser language auto-detection. |

---

## Category 9: Testing

| Gap | Description |
|---|---|
| E2E test suite | Playwright e2e tests not yet written. Happy path defined in docs but not automated. |
| API integration tests | Smoke tests not yet wired to CI. |
| Auth token in tests | Tests that require auth do not automatically create test users + tokens. |
| Load testing | No performance benchmarks. |
| Contract tests | No Pact/consumer-driven contract tests for API boundaries. |

---

## Assumptions Made Where Public Evidence Was Incomplete

| Area | Assumption | Basis |
|---|---|---|
| Auth token storage (mobile) | AsyncStorage used; should be SecureStore in production | Mobile security standard |
| KYC partner | Veriff mocked per public help docs | Public Deel docs confirm Veriff |
| Background check provider | Not identified; mocked entirely | Not public |
| Payroll tax engine | Not identified; placeholder | Not public |
| Contract template system | Internal engine assumed; no partner identified | Not public |
| Payment rails per country | Not identified; placeholder | Not public |
| Data residency | Single PostgreSQL instance; multi-region assumed for enterprise | Inferred from GDPR claims |
| Escrow model | Not modeled; assumed per-country financial entity | Inferred from EOR model |

---

## What's Confidently Built (No Gaps)

- Auth: email/password with JWT, session revocation, SCIM adapter skeleton
- Onboarding engine: state machine, rules engine, versioned configs, branching
- Individual + business flows end-to-end
- Web UI: multi-step form, branch-aware rendering, back navigation, review, complete
- i18n: en/es/fr keys, react-i18next wired
- HR platform: workers, contracts, payments, compliance, onboarding tasks, notifications, dashboard
- API: all 30+ endpoints responding with real DB data
