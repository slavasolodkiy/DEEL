# 08 — Open Questions & Build Confidence Assessment

---

## Section A: What We Can Build Confidently Now

These are areas where public evidence is sufficient to make high-fidelity product decisions.

### A1. Core Platform Modules ✅ Build with Confidence

| Module | What We Know | Build Confidence |
|---|---|---|
| Worker Directory | Employee + contractor + EOR personas; status, country, salary, type fields | High |
| Contract Management | Create, sign, amend, terminate; fixed/PAYG/milestone/time & materials types | High |
| Payroll Run | Approve/run payroll cycles; multi-currency; tax filing managed by platform | High |
| Compliance Tracker | Document collection per worker; country-specific doc types; status workflow | High |
| Onboarding Pipeline | Task-based; per-worker progress; document + access + equipment categories | High |
| Notifications | Real-time alerts for signings, approvals, deposits; read/unread state | High |
| Dashboard | Summary metrics (headcount, payroll, contracts, compliance risk); charts | High |
| Background Checks | Initiate, track, receive results; 190+ countries; automated + manual review | High |

### A2. Onboarding Flow ✅ Build with Confidence

| Flow Branch | Status |
|---|---|
| Worker type selection (EOR / Contractor / Person Profile / US PEO) | Design with confidence |
| EOR path: country → quote → fund → agreement → invite | Fully documented in public help docs |
| Contractor path: individual vs entity → country → contract type → sign | Fully documented |
| KYC via Veriff (automated, fallback manual) | Confirmed partner, confirmed flow |
| Entity contractor shareholder verification | Confirmed in public docs |
| Withdrawal method setup (bank, Wise, Payoneer) | Confirmed |
| Country-specific compliance document collection | Confirmed (specifics unknown per country) |

### A3. Integrations ✅ Build with Confidence

| Integration | Direction | Build Status |
|---|---|---|
| Okta SAML 2.0 SSO | Inbound auth | Implement SAML SP; follow Okta guide |
| Azure AD SAML 2.0 SSO | Inbound auth | Implement SAML SP; follow Azure guide |
| SCIM user provisioning | Inbound sync | Standard SCIM 2.0 schema |
| BambooHR / Workday / SAP | Bi-directional HR sync | Build import/export adapters |
| QuickBooks / Xero / NetSuite | Outbound payroll export | Journal entry + invoice export |
| Slack / Teams notifications | Outbound webhooks | Standard webhook notification system |
| Zapier / Make | Webhook triggers | Publish Zapier app + webhook events |
| Veriff KYC | Inbound verification | Veriff SDK integration |

### A4. API ✅ Build with Confidence

| Component | Implementation Guidance |
|---|---|
| REST API v2 structure | Follow `api.letsdeel.com/rest/v2` URL patterns |
| Bearer token auth (personal + org) | Standard JWT bearer; two token scopes |
| Webhook delivery | POST to customer URL; retry logic; signature verification |
| EOR endpoints | contracts, hiring, amendments, terminations, payslips |
| Contractor endpoints | contracts, timesheets, tasks, milestones, off-cycle, invoice adjustments |
| KYC/Screening endpoints | Initiate + retrieve screening results |
| Accounting endpoints | Invoices, payments, journal entries |
| Sandbox environment | Separate base URL with test credentials |

### A5. Mobile App ✅ Build with Confidence

| Feature | Platform | Implementation |
|---|---|---|
| Payslip view + download | iOS + Android | PDF viewer, secure download |
| Fund withdrawal | iOS + Android | Payment method selection + confirmation |
| Contract approvals (client) | iOS + Android | Push notification → approve flow |
| Onboarding alerts | iOS + Android | Push notification → task detail |
| Face ID / fingerprint login | iOS + Android | expo-local-authentication |
| SSO login | iOS + Android | expo-auth-session + SAML/OAuth |
| Offline mode (basic data) | iOS + Android | React Query persistence + AsyncStorage |
| Push notifications | iOS + Android | expo-notifications + FCM/APNs |
| Time-off request | iOS + Android | HRIS request form |
| Smart notification badges | iOS + Android | Unread count in header |

---

## Section B: Open Questions (Needs Further Validation)

### B1. Country-Specific Document Requirements

| Question | Why Important | How to Answer |
|---|---|---|
| What exact documents are required per country for EOR workers? | Compliance doc collection UI | Test live EOR quote flow; check help docs per country |
| What tax forms are generated per country? | Tax compliance UI | Check country-specific help articles |
| Which countries require work permit upload vs. local ID only? | Document checklist logic | Country-by-country help center audit |

### B2. Payment Infrastructure

| Question | Why Important | How to Answer |
|---|---|---|
| Which payment rails are used per country? (ACH, SEPA, local) | Payment processing logic | Not publicly documented; hypothesis only |
| What is the withdrawal fee structure per method? | Worker payout UI | Some public blog posts; incomplete |
| Is crypto payout still available? | Withdrawal method list | Conflicting signals; verify current app |
| What is the escrow/holding structure per EOR country? | Financial compliance | Not public; legal/regulatory inference only |

### B3. Contract Template Engine

| Question | Why Important | How to Answer |
|---|---|---|
| Are contracts generated from Deel-owned templates or partner templates? | Contract generation logic | Not public — internal system |
| What variables are injected per jurisdiction? | Template variable system | Not public |
| How does in-app redlining (Enterprise) work technically? | Contract negotiation UX | Not public |

### B4. Payroll Tax Engine

| Question | Why Important | How to Answer |
|---|---|---|
| Is tax calculation done in-house or via a provider (e.g., Symmetry, Vertex)? | Payroll accuracy | Not public |
| How are multi-country payroll consolidations handled? | Payroll run UX | Not public |
| What is the payroll calendar system (fixed vs. flexible pay cycles)? | Payroll scheduling logic | Inferred as flexible; not confirmed |

### B5. Mobile App Architecture

| Question | Why Important | How to Answer |
|---|---|---|
| React Native or Flutter? | Technology choice | Not confirmed; React Native most likely |
| Expo managed or bare workflow? | Build pipeline | Not public |
| How does offline sync work technically? | Cache strategy | Not public |

### B6. Data Residency & Compliance

| Question | Why Important | How to Answer |
|---|---|---|
| Which specific AWS regions are used? | Data residency for EU/APAC | Not public |
| Is data stored per-country or centrally with access controls? | GDPR / local data law compliance | Not public |
| What SOC certifications does Deel hold? | Enterprise trust | Not prominently listed publicly |

### B7. Deel Engage / Grow Modules

| Question | Why Important | How to Answer |
|---|---|---|
| What specific features are in Deel Engage (surveys, recognition)? | HRIS feature completeness | Minimal public documentation found |
| What is in Deel Grow (L&D)? | Career development feature | Minimal public documentation found |
| Are these native or third-party embedded? | Architecture decision | Not public |

### B8. Marketplace / Partner Program

| Question | Why Important | How to Answer |
|---|---|---|
| What is the revenue share model for partners? | Partner program design | Not public |
| What review process do integrations go through before listing? | App store quality control | Not public |
| How are partner apps sandboxed within Deel? | Security boundary | Not public |

---

## Section C: Risk Flags

| Risk | Description | Mitigation |
|---|---|---|
| KYC partner lock-in | Veriff confirmed; switching requires re-integration | Build KYC as an abstraction layer |
| Country-specific legal changes | EOR compliance shifts frequently | Build compliance rules as configurable data, not hardcoded |
| Pricing model shifts | Deel has changed pricing structures; current data may be stale | Source pricing from live page at build time |
| Mobile feature parity claim | "100% parity" is claimed but likely aspirational | Prioritize core worker self-service for mobile MVP |
| OAuth scope for third-party integrations | OAuth2 assumed for partners but not fully confirmed | Implement standard OAuth2 with scopes; safe default |
