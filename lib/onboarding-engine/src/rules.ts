import type { Condition, ConditionOperator, VisibilityRule, NextRule } from "./types.js";

function evaluateCondition(condition: Condition, answers: Record<string, unknown>): boolean {
  const { field, op, value } = condition;
  const answer = answers[field];

  switch (op as ConditionOperator) {
    case "eq":
      return answer === value;
    case "neq":
      return answer !== value;
    case "in":
      return Array.isArray(value) ? value.includes(answer as string) : false;
    case "not_in":
      return Array.isArray(value) ? !value.includes(answer as string) : true;
    case "exists":
      return answer !== undefined && answer !== null && answer !== "";
    case "not_exists":
      return answer === undefined || answer === null || answer === "";
    default:
      return false;
  }
}

export function evaluateVisibility(rule: VisibilityRule, answers: Record<string, unknown>): boolean {
  const results = rule.conditions.map((c) => evaluateCondition(c, answers));
  return rule.logic === "AND" ? results.every(Boolean) : results.some(Boolean);
}

export function evaluateNextStep(
  nextRules: NextRule[],
  answers: Record<string, unknown>,
): string | null {
  for (const rule of nextRules) {
    const results = rule.conditions.map((c) => evaluateCondition(c, answers));
    const matches = rule.logic === "AND" ? results.every(Boolean) : results.some(Boolean);
    if (matches) return rule.nextStepId;
  }
  return null;
}

export function isStepVisible(
  visibilityRules: VisibilityRule | undefined,
  answers: Record<string, unknown>,
): boolean {
  if (!visibilityRules) return true;
  return evaluateVisibility(visibilityRules, answers);
}
