import { describe, it, expect } from "vitest";
import { OnboardingEngine } from "../engine.js";
import { evaluateVisibility, evaluateNextStep } from "../rules.js";
import type { FlowConfig, VisibilityRule, NextRule } from "../types.js";

const MINIMAL_FLOW: FlowConfig = {
  id: "test",
  version: "v1",
  titleKey: "flows.test.title",
  descriptionKey: "flows.test.description",
  steps: [
    {
      id: "welcome",
      type: "info",
      titleKey: "steps.welcome.title",
      fields: [],
      defaultNextStepId: "entity_type",
    },
    {
      id: "entity_type",
      type: "question",
      titleKey: "steps.entity_type.title",
      fields: [
        {
          id: "entityType",
          type: "radio",
          labelKey: "fields.entityType.label",
          required: true,
          options: [
            { value: "individual", labelKey: "fields.entityType.options.individual" },
            { value: "company", labelKey: "fields.entityType.options.company" },
          ],
        },
      ],
      nextRules: [
        {
          logic: "AND",
          conditions: [{ field: "entityType", op: "eq", value: "company" }],
          nextStepId: "company_details",
        },
      ],
      defaultNextStepId: "contract_type",
    },
    {
      id: "company_details",
      type: "question",
      titleKey: "steps.company_details.title",
      visibilityRules: {
        logic: "AND",
        conditions: [{ field: "entityType", op: "eq", value: "company" }],
      },
      fields: [
        { id: "companyName", type: "text", labelKey: "fields.companyName.label", required: true },
      ],
      defaultNextStepId: "contract_type",
    },
    {
      id: "contract_type",
      type: "question",
      titleKey: "steps.contract_type.title",
      fields: [
        {
          id: "contractType",
          type: "radio",
          labelKey: "fields.contractType.label",
          required: true,
          options: [],
        },
      ],
      defaultNextStepId: "complete",
    },
    {
      id: "complete",
      type: "complete",
      titleKey: "steps.complete.title",
      fields: [],
      defaultNextStepId: null,
    },
  ],
};

describe("Rules Engine — evaluateVisibility", () => {
  it("returns true when no visibility rule is set", () => {
    expect(evaluateVisibility({ logic: "AND", conditions: [] }, {})).toBe(true);
  });

  it("returns true when AND condition is satisfied", () => {
    const rule: VisibilityRule = {
      logic: "AND",
      conditions: [{ field: "entityType", op: "eq", value: "company" }],
    };
    expect(evaluateVisibility(rule, { entityType: "company" })).toBe(true);
  });

  it("returns false when AND condition is not satisfied", () => {
    const rule: VisibilityRule = {
      logic: "AND",
      conditions: [{ field: "entityType", op: "eq", value: "company" }],
    };
    expect(evaluateVisibility(rule, { entityType: "individual" })).toBe(false);
  });

  it("returns true when OR condition has one matching condition", () => {
    const rule: VisibilityRule = {
      logic: "OR",
      conditions: [
        { field: "type", op: "eq", value: "a" },
        { field: "type", op: "eq", value: "b" },
      ],
    };
    expect(evaluateVisibility(rule, { type: "b" })).toBe(true);
  });

  it("handles 'in' operator correctly", () => {
    const rule: VisibilityRule = {
      logic: "AND",
      conditions: [{ field: "country", op: "in", value: ["US", "CA", "MX"] }],
    };
    expect(evaluateVisibility(rule, { country: "CA" })).toBe(true);
    expect(evaluateVisibility(rule, { country: "DE" })).toBe(false);
  });

  it("handles 'exists' operator", () => {
    const rule: VisibilityRule = {
      logic: "AND",
      conditions: [{ field: "companyName", op: "exists" }],
    };
    expect(evaluateVisibility(rule, { companyName: "Acme Inc" })).toBe(true);
    expect(evaluateVisibility(rule, {})).toBe(false);
    expect(evaluateVisibility(rule, { companyName: "" })).toBe(false);
  });

  it("handles 'not_exists' operator", () => {
    const rule: VisibilityRule = {
      logic: "AND",
      conditions: [{ field: "taxId", op: "not_exists" }],
    };
    expect(evaluateVisibility(rule, {})).toBe(true);
    expect(evaluateVisibility(rule, { taxId: "123" })).toBe(false);
  });
});

describe("Rules Engine — evaluateNextStep", () => {
  it("returns first matching rule's nextStepId", () => {
    const rules: NextRule[] = [
      {
        logic: "AND",
        conditions: [{ field: "hiringIntent", op: "eq", value: "eor" }],
        nextStepId: "eor_worker_country",
      },
      {
        logic: "AND",
        conditions: [{ field: "hiringIntent", op: "eq", value: "contractor" }],
        nextStepId: "contractor_details",
      },
    ];
    expect(evaluateNextStep(rules, { hiringIntent: "contractor" })).toBe("contractor_details");
  });

  it("returns null when no rule matches", () => {
    const rules: NextRule[] = [
      {
        logic: "AND",
        conditions: [{ field: "hiringIntent", op: "eq", value: "eor" }],
        nextStepId: "eor_worker_country",
      },
    ];
    expect(evaluateNextStep(rules, { hiringIntent: "global_payroll" })).toBeNull();
  });

  it("returns first match when multiple rules could match (OR logic)", () => {
    const rules: NextRule[] = [
      {
        logic: "OR",
        conditions: [
          { field: "entityType", op: "eq", value: "company" },
          { field: "entityType", op: "eq", value: "llc" },
        ],
        nextStepId: "company_details",
      },
    ];
    expect(evaluateNextStep(rules, { entityType: "llc" })).toBe("company_details");
  });
});

describe("OnboardingEngine — state machine", () => {
  const engine = new OnboardingEngine(MINIMAL_FLOW);

  it("returns the first step on initialization", () => {
    const state = engine.initializeSession(1);
    expect(state.currentStepId).toBe("welcome");
    expect(state.status).toBe("in_progress");
    expect(state.answers).toEqual({});
  });

  it("advances to default next step when no rules match", () => {
    const state = engine.initializeSession(1);
    const result = engine.submitAnswer(state, {});
    expect(result.state.currentStepId).toBe("entity_type");
    expect(result.isComplete).toBe(false);
  });

  it("branches to company_details when entityType=company", () => {
    const state1 = engine.initializeSession(1);
    const r1 = engine.submitAnswer(state1, {});
    const r2 = engine.submitAnswer(r1.state, { entityType: "company" });
    expect(r2.state.currentStepId).toBe("company_details");
    expect(r2.state.answers["entityType"]).toBe("company");
  });

  it("skips company_details when entityType=individual", () => {
    const state1 = engine.initializeSession(1);
    const r1 = engine.submitAnswer(state1, {});
    const r2 = engine.submitAnswer(r1.state, { entityType: "individual" });
    expect(r2.state.currentStepId).toBe("contract_type");
  });

  it("marks session complete on complete step", () => {
    let state = engine.initializeSession(1);
    state = engine.submitAnswer(state, {}).state;
    state = engine.submitAnswer(state, { entityType: "individual" }).state;
    state = engine.submitAnswer(state, { contractType: "fixed_rate" }).state;
    const result = engine.submitAnswer(state, {});
    expect(result.isComplete).toBe(true);
    expect(result.state.status).toBe("completed");
  });

  it("hides company_details step for individual entity type", () => {
    const visible = engine.getVisibleSteps({ entityType: "individual" });
    const ids = visible.map((s) => s.id);
    expect(ids).not.toContain("company_details");
    expect(ids).toContain("contract_type");
  });

  it("shows company_details step for company entity type", () => {
    const visible = engine.getVisibleSteps({ entityType: "company" });
    const ids = visible.map((s) => s.id);
    expect(ids).toContain("company_details");
  });

  it("calculates progress correctly", () => {
    const stepResult = engine.buildStepResult("welcome", {});
    expect(stepResult.progress).toBeGreaterThanOrEqual(0);
    expect(stepResult.progress).toBeLessThanOrEqual(100);
    expect(stepResult.isFirst).toBe(true);
  });

  it("resolves previous step id correctly", () => {
    const prev = engine.resolvePreviousStepId("entity_type", {});
    expect(prev).toBe("welcome");
  });

  it("returns null for previous step at first step", () => {
    const prev = engine.resolvePreviousStepId("welcome", {});
    expect(prev).toBeNull();
  });

  it("accumulates answers across steps", () => {
    let state = engine.initializeSession(1);
    state = engine.submitAnswer(state, {}).state;
    state = engine.submitAnswer(state, { entityType: "company" }).state;
    state = engine.submitAnswer(state, { companyName: "Acme Corp" }).state;
    expect(state.answers["entityType"]).toBe("company");
    expect(state.answers["companyName"]).toBe("Acme Corp");
  });
});

describe("OnboardingEngine — validateStepAnswers", () => {
  const engine = new OnboardingEngine(MINIMAL_FLOW);

  it("passes when all required fields are provided", () => {
    const result = engine.validateStepAnswers(
      MINIMAL_FLOW.steps.find((s) => s.id === "entity_type")!,
      { entityType: "individual" },
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("fails when a required field is missing", () => {
    const result = engine.validateStepAnswers(
      MINIMAL_FLOW.steps.find((s) => s.id === "entity_type")!,
      {},
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.field).toBe("entityType");
  });

  it("fails when a required field is an empty string", () => {
    const result = engine.validateStepAnswers(
      MINIMAL_FLOW.steps.find((s) => s.id === "company_details")!,
      { companyName: "   " },
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]!.field).toBe("companyName");
  });

  it("fails when a required field is an empty array", () => {
    const step = {
      id: "docs",
      type: "document_upload" as const,
      titleKey: "steps.docs.title",
      fields: [{ id: "files", type: "file" as const, labelKey: "fields.files.label", required: true }],
    };
    const result = engine.validateStepAnswers(step, { files: [] });
    expect(result.valid).toBe(false);
    expect(result.errors[0]!.field).toBe("files");
  });

  it("skips optional fields", () => {
    const step = {
      id: "welcome",
      type: "info" as const,
      titleKey: "steps.welcome.title",
      fields: [{ id: "notes", type: "text" as const, labelKey: "fields.notes.label", required: false }],
    };
    const result = engine.validateStepAnswers(step, {});
    expect(result.valid).toBe(true);
  });

  it("accumulates multiple errors for multiple missing fields", () => {
    const step = MINIMAL_FLOW.steps.find((s) => s.id === "entity_type")!;
    const multiFieldStep = {
      ...step,
      fields: [
        { id: "f1", type: "text" as const, labelKey: "l", required: true },
        { id: "f2", type: "text" as const, labelKey: "l", required: true },
        { id: "f3", type: "text" as const, labelKey: "l", required: false },
      ],
    };
    const result = engine.validateStepAnswers(multiFieldStep, {});
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });
});

describe("OnboardingEngine — branching behavior", () => {
  const engine = new OnboardingEngine(MINIMAL_FLOW);

  it("routes to company_details when entityType is company", () => {
    const state = engine.initializeSession(99);
    const afterWelcome = engine.submitAnswer(state, {}).state;
    const result = engine.submitAnswer(afterWelcome, { entityType: "company" });
    expect(result.state.currentStepId).toBe("company_details");
  });

  it("routes to contract_type when entityType is individual (skips company_details)", () => {
    const state = engine.initializeSession(99);
    const afterWelcome = engine.submitAnswer(state, {}).state;
    const result = engine.submitAnswer(afterWelcome, { entityType: "individual" });
    expect(result.state.currentStepId).toBe("contract_type");
  });

  it("company_details is not visible when entityType is individual", () => {
    const visible = engine.getVisibleSteps({ entityType: "individual" });
    const ids = visible.map((s) => s.id);
    expect(ids).not.toContain("company_details");
  });

  it("company_details is visible when entityType is company", () => {
    const visible = engine.getVisibleSteps({ entityType: "company" });
    const ids = visible.map((s) => s.id);
    expect(ids).toContain("company_details");
  });
});

describe("OnboardingEngine — flow integrity", () => {
  it("all steps have unique IDs", () => {
    const ids = MINIMAL_FLOW.steps.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all defaultNextStepIds reference existing step IDs or null", () => {
    const validIds = new Set([...MINIMAL_FLOW.steps.map((s) => s.id), null]);
    for (const step of MINIMAL_FLOW.steps) {
      if (step.defaultNextStepId !== undefined) {
        expect(validIds.has(step.defaultNextStepId)).toBe(true);
      }
    }
  });

  it("all nextRules reference existing step IDs", () => {
    const validIds = new Set(MINIMAL_FLOW.steps.map((s) => s.id));
    for (const step of MINIMAL_FLOW.steps) {
      for (const rule of step.nextRules ?? []) {
        expect(validIds.has(rule.nextStepId)).toBe(true);
      }
    }
  });
});
