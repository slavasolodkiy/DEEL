# Integrations

## Overview

The platform exposes integration adapters as mockable boundary services. Each integration is isolated behind an adapter interface so real services can be swapped in without touching core business logic.

---

## 1. Authentication Integrations

### 1a. OAuth 2.0 / OIDC (Mock Adapter)

**Location:** `artifacts/api-server/src/routes/auth.ts` — `GET /api/auth/oauth/:provider`

**Behavior:**
- Accepts `provider` path param (`google`, `github`, etc.)
- Creates or retrieves a test user (`demo+{provider}@globalhr-platform.dev`)
- Returns a real JWT token
- No actual OAuth flow is initiated — this simulates the callback stage

**To integrate a real OAuth provider:**
1. Replace the mock handler with an OAuth2 redirect
2. Use `passport.js` with `passport-google-oauth20` or similar
3. Implement the callback route to exchange code for user info
4. Store `oauthProvider` and `oauthProviderId` on the `users` table (columns already exist)

---

### 1b. SSO / SAML (Mock Adapter)

**Location:** `artifacts/api-server/src/routes/auth.ts` — `POST /api/auth/sso/callback`

**Behavior:**
- Accepts `{ email, firstName, lastName, organizationId, provider }` in request body
- No SAML XML parsing — simulates the identity assertion stage
- Creates or updates user in `users` table
- Returns a real JWT token

**Note:** This mock is intentionally thin. In production:
1. Use `passport-saml` or `node-saml` for XML assertion parsing
2. Validate SAML signature against IdP certificate
3. Map SAML attributes to user fields
4. Enforce `ssoOrganizationId` for multi-tenant SSO

**OpenAPI spec:** `openapi/auth.yaml#/paths/~1sso~1callback`

---

### 1c. SCIM 2.0 (Mock Adapter)

**Location:** `artifacts/api-server/src/routes/auth.ts` — `/api/auth/scim/v2/Users`

**Behavior:**
- Full CRUD against `users` table: List, Create, Get, Patch, Delete
- Conforms to SCIM 2.0 schema (`urn:ietf:params:scim:schemas:core:2.0:User`)
- PATCH supports `replace` operations (active = false → deactivate)
- No SCIM group support yet (see KNOWN_GAPS.md)

**To use with Okta or Azure AD:**
1. Point IdP SCIM base URL to `/api/auth/scim/v2`
2. Configure bearer token in IdP (use an organization API token)
3. Enable provisioning in the IdP SCIM settings
4. Users are then provisioned/deprovisioned automatically

**OpenAPI spec:** `openapi/auth.yaml#/paths/~1scim~1v2~1Users`

---

## 2. Identity Verification (KYC)

**Integration:** Veriff (production) / Mock (current)

**Locations:**
- Onboarding step: `kyc_verification` step type in `lib/onboarding-engine/src/flows/individual-v1.json`
- Step renderer: `artifacts/web/src/pages/onboard/step-renderer.tsx`
- API for KYC screening: `openapi/auth.yaml` references `developer.deel.com/api/platform/screenings`

**Current behavior:**
- Step renders a "Start verification" UI with two options: Approved (mock) or Manual review (mock)
- No actual document upload or liveness check

**To integrate Veriff:**
1. Install `@veriff/js-sdk`
2. Create a Veriff session server-side (POST to Veriff API with user data)
3. Load Veriff SDK in the browser and redirect to Veriff flow
4. Receive webhook callback at `/api/kyc/webhook` with verification result
5. Update `onboarding_sessions.answers.kycStatus` accordingly

---

## 3. HR System Integrations (HRIS)

**Supported (planned adapters):**

| System | Type | Direction | Status |
|---|---|---|---|
| BambooHR | HRIS | Bi-directional | Planned adapter |
| Workday | HRIS | Bi-directional | Planned adapter |
| SAP SuccessFactors | HRIS | Bi-directional | Planned adapter |
| UKG Ready | HRIS | Bi-directional | Planned adapter |
| Greenhouse | ATS | Inbound (import hires) | Planned adapter |
| Lever | ATS | Inbound (import hires) | Planned adapter |

**Adapter pattern:**

```typescript
// lib/integrations/hris-adapter.ts (pattern)
interface HRISAdapter {
  listEmployees(): Promise<Worker[]>;
  syncEmployee(worker: Worker): Promise<void>;
  deleteEmployee(externalId: string): Promise<void>;
}
```

**To add a HRIS integration:**
1. Implement `HRISAdapter` for the target system
2. Store API credentials in environment secrets (never in code)
3. Add a sync job (could use pg-based job queue or Bull/BullMQ with Redis)
4. Expose a webhook endpoint for real-time events from the HRIS

---

## 4. Accounting Integrations

**Supported (planned):**

| System | Direction | What Syncs |
|---|---|---|
| QuickBooks | Outbound | Payroll journal entries, invoices |
| Xero | Outbound | Payroll journal entries, invoices |
| NetSuite | Outbound | ERP-level payroll and expense sync |

**Pattern:** On payroll run approval, generate a journal entry payload and POST to the accounting API.

---

## 5. Collaboration Notifications

**Slack / Microsoft Teams:**

- Add a webhook URL per organization (stored in `organizations` table as `slackWebhookUrl`)
- On key events (contract signed, payment approved, onboarding complete), POST to the webhook
- Slack: Block Kit message format
- Teams: Adaptive Card format

---

## 6. Payment Rails

**Not yet implemented.** See KNOWN_GAPS.md.

The platform currently models payment runs in the database but does not initiate actual fund transfers. Production integration would require:

| Rail | Use Case | Provider |
|---|---|---|
| ACH | US payroll | Stripe, Dwolla, or banking partner |
| SEPA | EU payroll | Banking partner or Wise for Business |
| SWIFT | Global wires | Banking partner |
| Wise API | Multi-currency transfers | Wise for Business |
| Payoneer API | Contractor payouts | Payoneer mass payout API |

---

## 7. MCP Server (AI Agent)

**Status:** Planned

Following Deel's public MCP server pattern (`developer.deel.com/mcp`), the platform can expose an MCP server to allow LLM agents to:
- Query worker/contract/payment data
- Initiate onboarding sessions
- Trigger compliance document requests

**To implement:** Build an MCP server using the Model Context Protocol SDK, exposing tools that call internal APIs with appropriate auth.

---

## 8. Background Checks

**Not yet implemented.** See KNOWN_GAPS.md.

Integration target: Sterling, First Advantage, or Veriff background check product.

Pattern:
1. Client initiates check via `/api/background-checks` endpoint
2. Platform calls background check provider API
3. Webhook receives result, updates compliance item status
4. Notify client admin via notification

---

## Environment Variables Required

| Variable | Purpose | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `JWT_SECRET` | JWT signing (falls back to SESSION_SECRET) | Yes |
| `SESSION_SECRET` | Session signing fallback | Yes |
| `VERIFF_API_KEY` | Veriff KYC (production) | No (mock) |
| `VERIFF_SECRET` | Veriff webhook signature | No (mock) |
| `SLACK_WEBHOOK_URL` | Slack notifications | No |
| `REDIS_URL` | Redis for job queues (future) | No |
| `STRIPE_SECRET_KEY` | SaaS billing (future) | No |
