# Onboarding Engine

## Overview

The onboarding engine is a config-driven, state-machine system that guides users through multi-step registration flows. It supports branching logic based on answers, country/entity-type overrides, and versioned flow configurations.

Located at: `lib/onboarding-engine/`

---

## Architecture

```
lib/onboarding-engine/
├── src/
│   ├── types.ts          — TypeScript types for flows, steps, fields, states, rules
│   ├── rules.ts          — Pure rules engine: evaluateCondition, evaluateVisibility, evaluateNextStep
│   ├── engine.ts         — OnboardingEngine class: state machine logic
│   ├── registry.ts       — Flow loader + engine factory
│   ├── index.ts          — Public exports
│   ├── flows/
│   │   ├── individual-v1.json   — Individual (worker/contractor) onboarding flow
│   │   └── business-v1.json     — Business (employer) onboarding flow
│   └── __tests__/
│       └── engine.test.ts       — Unit tests for rules + state machine
```

---

## Flow Config Schema

Each flow is a JSON file with the following structure:

```typescript
interface FlowConfig {
  id: string;            // "individual" | "business"
  version: string;       // "v1"
  titleKey: string;      // i18n key
  descriptionKey: string;
  steps: Step[];
}

interface Step {
  id: string;
  type: StepType;        // "info" | "question" | "document_upload" | "verification" | "review" | "complete"
  titleKey: string;
  descriptionKey?: string;
  fields: FieldDef[];
  visibilityRules?: VisibilityRule;   // Hides step if conditions not met
  nextRules?: NextRule[];             // Conditional branching: first match wins
  defaultNextStepId?: string | null;  // Fallback next step
}
```

### Field Types

| Type | Widget | Notes |
|---|---|---|
| `text` | Input[text] | General text input |
| `email` | Input[email] | Email validation |
| `password` | Input[password] | Masked input |
| `tel` | Input[tel] | Phone number |
| `date` | Input[date] | Date picker |
| `select` | Select | Dropdown with fixed options |
| `radio` | RadioGroup | Single select with card UI |
| `checkbox` | Checkbox | Boolean consent fields |
| `file` | File drop zone | Document upload |
| `country` | Select | From COUNTRIES constant |
| `currency` | Select | From CURRENCIES constant |

---

## Rules Engine

Located in `lib/onboarding-engine/src/rules.ts`. Pure functions — no side effects.

### Condition Operators

| Operator | Meaning |
|---|---|
| `eq` | `answers[field] === value` |
| `neq` | `answers[field] !== value` |
| `in` | `value.includes(answers[field])` |
| `not_in` | `!value.includes(answers[field])` |
| `exists` | `answers[field]` is set and non-empty |
| `not_exists` | `answers[field]` is undefined/null/empty |

### Visibility Rules

Steps can be hidden from the flow if their `visibilityRules` conditions are not met. This is evaluated dynamically based on current answers.

```json
{
  "visibilityRules": {
    "logic": "AND",
    "conditions": [{ "field": "entityType", "op": "eq", "value": "company" }]
  }
}
```

### Next Step Rules

Steps can branch to different next steps based on answers. Rules are evaluated in order; first match wins. Falls back to `defaultNextStepId`.

```json
{
  "nextRules": [
    {
      "logic": "AND",
      "conditions": [{ "field": "hiringIntent", "op": "eq", "value": "eor" }],
      "nextStepId": "eor_worker_country"
    }
  ],
  "defaultNextStepId": "billing_setup"
}
```

---

## State Machine

The `OnboardingEngine` class manages state transitions:

```typescript
const engine = getEngine("individual", "v1");

// Initialize a new session state
const state = engine.initializeSession(sessionId);
// → { sessionId, flowId, flowVersion, currentStepId: "welcome", answers: {}, status: "in_progress", completedStepIds: [] }

// Submit answers for current step
const result = engine.submitAnswer(state, { entityType: "company" });
// → { nextStep: StepResult, isComplete: false, state: UpdatedOnboardingState }

// Get visible steps (respects visibility rules)
const visible = engine.getVisibleSteps(state.answers);

// Go back
const prevStepId = engine.resolvePreviousStepId(state.currentStepId, state.answers);
```

### State Persistence

State is persisted in PostgreSQL via the `onboarding_sessions` table:

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | Session identifier |
| `user_id` | integer (nullable) | Null for anonymous sessions |
| `flow_id` | text | "individual" or "business" |
| `flow_version` | text | "v1" |
| `current_step_id` | text | Current step in the machine |
| `answers` | jsonb | All accumulated answers |
| `status` | text | "in_progress" / "completed" / "abandoned" |
| `completed_at` | timestamp | Set when status = completed |

Step history is logged in `onboarding_step_log`.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/onboarding-engine/flows` | List all available flow summaries |
| `GET` | `/api/onboarding-engine/flows/:flowId` | Get full flow config |
| `POST` | `/api/onboarding-engine/sessions` | Start a new session |
| `GET` | `/api/onboarding-engine/sessions/:id` | Get current session + step |
| `POST` | `/api/onboarding-engine/sessions/:id/answer` | Submit answers, advance step |
| `POST` | `/api/onboarding-engine/sessions/:id/back` | Navigate to previous step |

---

## Branching Map: Individual Flow (v1)

```
welcome
  └─→ personal_info
        └─→ country_select
              └─→ entity_type
                    ├─[entityType=company]─→ company_details → contract_type
                    └─[default]─────────────→ contract_type
                                                  └─→ withdrawal_method
                                                        └─→ tax_info
                                                              ├─[country=EU]─→ gdpr_consent → document_upload
                                                              └─[default]───→ document_upload
                                                                                  └─→ kyc_verification
                                                                                        └─→ review
                                                                                              └─→ complete
```

## Branching Map: Business Flow (v1)

```
welcome
  └─→ company_info
        └─→ hq_country
              └─→ hiring_intent
                    ├─[eor]──────────→ eor_worker_country → eor_quote → billing_setup
                    ├─[contractor]───→ contractor_details → billing_setup
                    ├─[global_payroll]→ gp_entity_confirm → billing_setup
                    ├─[us_peo]───────→ peo_state_select → billing_setup
                    └─[default]──────→ billing_setup
                                            └─→ admin_info
                                                  └─→ review
                                                        └─→ complete
```

---

## Adding a New Flow

1. Create `lib/onboarding-engine/src/flows/{flowId}-{version}.json`
2. Add the flow to `listFlows()` in `registry.ts`
3. Add translation keys to `lib/i18n/src/locales/{en,es,fr}.json`
4. Optionally add country-specific overrides

## Adding a New Step Type

1. Add to `StepType` union in `types.ts`
2. Implement rendering in `artifacts/web/src/pages/onboard/step-renderer.tsx`
3. Implement mobile rendering in `artifacts/mobile/src/screens/onboard/StepRenderer.tsx`
