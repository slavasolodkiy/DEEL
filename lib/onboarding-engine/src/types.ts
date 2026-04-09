export type FieldType =
  | "text"
  | "email"
  | "password"
  | "tel"
  | "date"
  | "select"
  | "radio"
  | "checkbox"
  | "file"
  | "country"
  | "currency";

export interface FieldOption {
  value: string;
  labelKey: string;
}

export interface FieldDef {
  id: string;
  type: FieldType;
  labelKey: string;
  placeholderKey?: string;
  required: boolean;
  options?: FieldOption[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    errorKey?: string;
  };
}

export type ConditionOperator = "eq" | "neq" | "in" | "not_in" | "exists" | "not_exists";

export interface Condition {
  field: string;
  op: ConditionOperator;
  value?: string | string[];
}

export type RuleLogic = "AND" | "OR";

export interface VisibilityRule {
  logic: RuleLogic;
  conditions: Condition[];
}

export interface NextRule {
  conditions: Condition[];
  logic: RuleLogic;
  nextStepId: string;
}

export type StepType = "info" | "question" | "document_upload" | "verification" | "review" | "complete";

export interface Step {
  id: string;
  type: StepType;
  titleKey: string;
  descriptionKey?: string;
  fields: FieldDef[];
  visibilityRules?: VisibilityRule;
  nextRules?: NextRule[];
  defaultNextStepId?: string | null;
}

export interface FlowConfig {
  id: string;
  version: string;
  titleKey: string;
  descriptionKey: string;
  steps: Step[];
}

export type OnboardingStatus = "in_progress" | "completed" | "abandoned";

export interface OnboardingState {
  sessionId: number;
  flowId: string;
  flowVersion: string;
  currentStepId: string;
  answers: Record<string, unknown>;
  status: OnboardingStatus;
  completedStepIds: string[];
}

export interface StepResult {
  stepId: string;
  step: Step;
  isFirst: boolean;
  isLast: boolean;
  previousStepId: string | null;
  nextStepId: string | null;
  progress: number;
}

export interface SubmitAnswerResult {
  nextStep: StepResult | null;
  isComplete: boolean;
  state: OnboardingState;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
