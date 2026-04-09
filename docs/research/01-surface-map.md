# 01 — Surface Map: Deel Platform (Public)

> Research date: April 2026 | Sources: deel.com, App Store, Google Play, help.letsdeel.com, developer.deel.com | All claims public only.

---

## 1. Web Platform — deel.com

### 1.1 Public Marketing Surfaces

| Surface | URL | Description | Confidence |
|---|---|---|---|
| Homepage | https://www.deel.com/ | Platform overview, nav to all modules | High |
| HR Platform hub | https://www.deel.com/hr-platform/ | Full HRIS module listing | High |
| EOR (Employer of Record) | https://www.deel.com/solutions/payroll/eor/ | EOR hiring without local entity | High |
| Contractor Management | https://www.deel.com/solutions/contractors/ | Hire/pay global contractors | High |
| Global Payroll | https://www.deel.com/blog/deel-launches-global-payroll/ | In-house payroll 90+ countries | High |
| US PEO | https://www.deel.com/peo/ | US co-employment partner, all 50 states | High |
| Background Checks | https://www.deel.com/background-checks/ | 190+ countries, managed end-to-end | High |
| Immigration | https://www.deel.com/immigration/ | Visa support globally | High |
| Deel IT | https://www.deel.com/it-solutions/ | Device & app lifecycle management | High |
| Integrations App Store | https://www.deel.com/integrations/ | Third-party app marketplace | High |
| Pricing | https://www.deel.com/pricing/ | Per-plan pricing page | High |
| API (marketing) | https://www.deel.com/hr-platform/api/ | API for external integrations pitch | High |

### 1.2 Authenticated App Surfaces (Inferred from Public Docs)

| Surface | Persona | Description | Confidence |
|---|---|---|---|
| Dashboard / Command Center | Client Admin | Overview metrics, tasks, activity feed | High |
| Worker Directory | Client Admin | Employee + contractor roster | High |
| Contract Management | Client Admin | Create, sign, amend, terminate contracts | High |
| Payroll Run Center | Client Admin | Global payroll runs, approvals | High |
| Compliance Hub | Client Admin | Document collection, status tracking | High |
| Onboarding Tracker | Client Admin | Per-worker onboarding task pipeline | High |
| People / HRIS | Client Admin | Org chart, time-off, performance | High |
| Accounting | Client Admin | Invoices, expense reconciliation | High |
| Notifications | All | Real-time alerts for approvals, signings | High |
| Worker Self-Service | Worker | Payslips, contracts, withdraw funds, leave | High |
| Settings / Team Mgmt | Client Admin | Roles, permissions, SSO, billing | High |
| Deel Engage | Client Admin | Surveys, recognition, performance | Medium |
| Deel Grow | Client Admin | L&D, career development | Medium |

---

## 2. Developer / API Surface

| Surface | URL | Status | Confidence |
|---|---|---|---|
| Developer Portal | https://developer.deel.com | Public | High |
| API Introduction | https://developer.deel.com/api/introduction | Public | High |
| EOR API Reference | https://developer.deel.com/api/employer-of-record | Public | High |
| Contractors API Reference | https://developer.deel.com/api/contractors | Public | High |
| Global Payroll API | https://developer.deel.com/api/global-payroll | Public | High |
| Deel IT API | https://developer.deel.com/api/deel-it | Public | High |
| KYC / Screening API | https://developer.deel.com/api/platform/screenings | Public | High |
| Immigration API | https://developer.deel.com/api/platform/immigration | Public | High |
| Accounting API | https://developer.deel.com/api/reference/endpoints/accounting | Public | High |
| Webhooks | Supported (event-driven) | Public, details at developer.deel.com | High |
| MCP Server | https://developer.deel.com/mcp | Public (AI Agent integration) | High |
| Partner / App Store | https://developer.deel.com/api/partners/introduction | Public | High |
| Sandbox API base | https://sandbox-api.deel.com | Public | High |
| Production API base | https://api.letsdeel.com/rest/v2 | Public | High |
| Community | https://stack.deel.com | Public | High |

### 2.1 API Authentication

| Method | Details | Confidence |
|---|---|---|
| Bearer Token (Personal) | User-scoped, inherits user permissions | High |
| Bearer Token (Organization) | Service-account scoped, broader access | High |
| OAuth 2.0 | Available for partner integrations | Medium |
| All requests require HTTPS | Enforced at API gateway | High |

---

## 3. Help Center Surface

| Surface | URL | Confidence |
|---|---|---|
| Help Center root | https://help.letsdeel.com | High |
| Contractor verification | https://help.letsdeel.com/hc/en-gb/articles/4407737887889 | High |
| EOR onboarding guide | https://help.letsdeel.com/hc/en-gb/articles/4407737620113 | High |
| Okta SSO setup | https://help.letsdeel.com/hc/en-gb/articles/22184491367953 | High |
| Azure AD SSO setup | https://help.letsdeel.com/hc/en-gb/articles/22182936274833 | High |
| API usage guide | https://help.letsdeel.com/hc/en-gb/articles/8801712601233 | High |

---

## 4. Mobile App Surfaces

### 4.1 iOS (App Store)
- **App name:** Deel: Global Payroll & HR
- **Bundle ID:** id6478083155 (App Store)
- **Developer:** Deel (id: 1731698446)
- **Launched:** September 2024
- **URL:** https://apps.apple.com/us/app/deel-global-payroll-hr/id6478083155
- **Sign-in:** SSO, Face ID, fingerprint supported

### 4.2 Android (Google Play)
- **App name:** Deel: Global Payroll & HR
- **Package ID:** `com.deel.app`
- **URL:** https://play.google.com/store/apps/details?id=com.deel.app
- **Sign-in:** SSO, biometric supported

### 4.3 Mobile Feature Set (Verified from App Store / Blog)

| Feature | Persona | Confidence |
|---|---|---|
| View and download payslips | Worker | High |
| Withdraw funds | Worker | High |
| Access tax documents | Worker | High |
| Contract approvals | Client | High |
| Onboarding alerts | Client | High |
| Approve time-off requests | Client | High |
| Smart push notifications (paycheck deposits, contract signings) | Both | High |
| SSO / Face ID / fingerprint login | Both | High |
| Offline mode (basic data access) | Both | High |
| 100% feature parity with web (claimed) | Both | Medium |

---

## 5. Scale & Market Position (Verified Public Claims)

| Metric | Value | Source | Confidence |
|---|---|---|---|
| Countries supported (platform) | 160+ | deel.com homepage | High |
| EOR countries | 150+ | deel.com/solutions/payroll/eor | High |
| Global Payroll countries | 120–130 | multiple sources | High |
| Contractor countries | 150+ | deel.com | High |
| Currencies supported | 120+ | deel.com | High |
| Annual payroll processed | $22B | deel.com | High |
| Customers | 35,000+ | deel.com | High |
| Workers on platform | 1.5M+ | deel.com | High |
| Background check countries | 190+ | deel.com/background-checks | High |
| Background check turnaround | >95% in minutes | deel.com | High |
| Founded | 2019 | multiple public sources | High |
| Founders | Alex Bouaziz (CEO), Shuo Wang (CRO) | public sources | High |

---

## 6. Pricing Tiers (Verified — April 2026)

| Plan | Price | Target | Confidence |
|---|---|---|---|
| EOR Standard | $599/employee/month | SMB global hire | High |
| EOR Enterprise | $899/employee/month | Enterprise EOR | High |
| US PEO | $125/employee/month | US co-employment | High |
| Contractor Standard | $49/contractor/month | Global contractors | High |
| HRIS | Free (bundled with payroll) | People management | Medium |
| Global Payroll | Custom / per seat | Own-entity payroll | Medium |
| Deel IT | Custom | Device management | Medium |
| Background Checks | Per-check pricing | Unknown | Low |
