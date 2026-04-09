# 02 — Architecture Hypotheses

> All items in this document are **hypotheses** unless explicitly marked **[VERIFIED]**. Sources are public signals only.

---

## 1. Frontend Architecture

| Layer | Hypothesis | Signal | Confidence |
|---|---|---|---|
| Web framework | React (SPA or hybrid SSR) | Job postings, engineering blog mentions | Medium |
| Routing | Client-side routing (React Router or similar) | SPA behavior, URL patterns | Medium |
| State management | React Query + context or Redux | Standard enterprise React stack | Low |
| Styling | Tailwind CSS or CSS-in-JS | No confirmed public signal | Low |
| Component library | Custom design system | Consistent brand across surfaces | Medium |
| Bundler | Webpack or Vite | Unknown | Low |
| Mobile | React Native (Expo or bare) | Single codebase `com.deel.app` + iOS, cross-platform look | Medium |
| Mobile sign-in | Expo SecureStore / Keychain for tokens | Standard RN auth pattern | Low |
| Offline mode | Redux Persist or WatermelonDB | Claimed offline access in app store | Low |

---

## 2. Backend Architecture

| Layer | Hypothesis | Signal | Confidence |
|---|---|---|---|
| API style | REST (v2) **[VERIFIED]** | `https://api.letsdeel.com/rest/v2` public docs | High |
| API versioning | Path-based (`/rest/v2`) **[VERIFIED]** | Developer docs | High |
| API gateway | Custom or AWS API Gateway | Scale, multi-region hints | Low |
| Language | Node.js (TypeScript) primary; possibly Go/Python for data pipelines | Engineering blog signals | Low |
| Auth layer | JWT Bearer tokens **[VERIFIED]** + OAuth2 for partners | Developer docs | High |
| Multi-tenancy | Organization-scoped data isolation | API resource structure (org ID required) | Medium |
| Webhook delivery | Event-driven, HTTP POST to customer endpoints | Mentioned in developer docs | High |
| Rate limiting | Enforced (specifics unknown) | Standard API practice + developer doc hints | Medium |

---

## 3. Database & Storage

| Layer | Hypothesis | Signal | Confidence |
|---|---|---|---|
| Primary DB | PostgreSQL | Industry standard for fintech/HR; compliance audit trail needs | Medium |
| Document storage | S3-compatible (AWS S3 or GCS) | Contracts, payslips, tax docs as PDFs | Medium |
| Search | Elasticsearch or Algolia | Worker/contract search across millions of records | Low |
| Cache | Redis | Session management, rate limiting, notification queuing | Medium |
| Data warehouse | Snowflake or BigQuery | Analytics, payroll reporting at $22B scale | Low |

---

## 4. Identity & Authentication

| Component | Hypothesis | Signal / Source | Confidence |
|---|---|---|---|
| SSO: SAML 2.0 | **[VERIFIED]** — Okta and Azure AD | help.letsdeel.com/hc/en-gb/articles/22184491367953 | High |
| SSO: Azure AD | **[VERIFIED]** | help.letsdeel.com/hc/en-gb/articles/22182936274833 | High |
| SCIM provisioning | Supported (user sync) | Help center SCIM articles exist | High |
| Mobile auth | Face ID / fingerprint **[VERIFIED]** | App Store listing | High |
| MFA | Supported | Enterprise security expectation + EOR plan includes it | Medium |
| Session management | JWT with refresh tokens | Standard stateless API auth | Medium |
| Identity provider | Internal auth + federated IdP | Enterprise plan includes SSO/SAML **[VERIFIED]** | High |

---

## 5. Payments & Financial Infrastructure

| Component | Hypothesis | Signal | Confidence |
|---|---|---|---|
| Payment rails | Mix: ACH (US), SEPA (EU), SWIFT (global), local rails | Multi-currency, 120+ currencies **[VERIFIED]** | High |
| Fiat off-ramp | Wise/Transferwise, local bank integrations | Industry standard for global payroll | Medium |
| Crypto payouts | Mentioned historically | Blog posts (may be discontinued) | Low |
| Payment processor | Stripe (for card/contractor billing) | Standard SaaS billing | Low |
| Payroll escrow | Funds held by Deel entity per country | EOR model requirement | Medium |
| Invoicing engine | Internal | Invoice adjustments API exists **[VERIFIED]** | High |

---

## 6. Compliance & Legal Infrastructure

| Component | Hypothesis | Signal | Confidence |
|---|---|---|---|
| Local entity network | 150+ Deel-owned or partner entities | EOR model: "no local entity needed" **[VERIFIED]** | High |
| Contract engine | Jurisdiction-specific templates | Automated contracts per country/type **[VERIFIED]** | High |
| KYC/AML provider | **Veriff** **[VERIFIED]** | help.letsdeel.com contractor verification article | High |
| Background checks | **Managed end-to-end internally** **[VERIFIED]** | deel.com/background-checks | High |
| Background check partner | Sterling, First Advantage, or similar | Unknown — possibly white-labelled | Low |
| Tax filing automation | Per-country tax engine | Managed payroll, tax filings **[VERIFIED]** | High |
| Document vault | Encrypted S3-class storage per worker | Compliance requires audit trail | Medium |

---

## 7. Third-Party Integrations Infrastructure

| Layer | Hypothesis | Signal | Confidence |
|---|---|---|---|
| Integration runtime | Custom iPaaS or Merge.dev unified API | Merge.dev lists Deel as supported system | Medium |
| Webhook system | Customer-configurable webhooks | Developer docs reference webhooks | High |
| Partner app store | **[VERIFIED]** | deel.com/integrations + developer.deel.com/api/partners | High |
| MCP (AI agent layer) | **[VERIFIED]** | developer.deel.com/mcp — Deel MCP Server listed | High |
| HRIS sync direction | Bi-directional (Deel ↔ BambooHR/Workday) | Integration pages describe sync | Medium |

---

## 8. Deployment & Infrastructure

| Layer | Hypothesis | Signal | Confidence |
|---|---|---|---|
| Cloud provider | AWS (primary) | Scale, global data residency needs, common enterprise choice | Medium |
| CDN | Cloudflare or AWS CloudFront | Global users, performance | Low |
| Multi-region | Yes — data residency for EU/APAC | GDPR compliance, enterprise plan | Medium |
| Containerization | Kubernetes on EKS | Scale: 1.5M workers, $22B payroll | Low |
| Observability | Datadog or equivalent | Enterprise engineering standard | Low |
| Audit log export | **[VERIFIED]** — SIEM export in Enterprise plan | deel.com/pricing | High |

---

## 9. What Is Confirmed vs. Hypothesized (Summary)

### Confirmed (Public Evidence)
- REST API v2 at `https://api.letsdeel.com/rest/v2`
- Bearer token auth (personal + org tokens)
- Webhook delivery
- SAML 2.0 SSO: Okta, Azure AD
- Veriff for KYC identity verification
- MCP server for AI agent integration
- 150+ EOR countries, 120+ currencies
- Mobile apps: iOS + Android launched Sept 2024
- Pricing tiers with public numbers

### Unconfirmed (Best-Guess Hypotheses)
- React/React Native stack
- PostgreSQL primary DB
- AWS infrastructure
- Stripe for SaaS billing
- Specific payroll rails per country
- Specific background check sub-vendor
