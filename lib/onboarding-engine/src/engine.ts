import type {
  FlowConfig,
  OnboardingState,
  StepResult,
  SubmitAnswerResult,
  Step,
} from "./types.js";
import { evaluateNextStep, isStepVisible } from "./rules.js";

export class OnboardingEngine {
  private flow: FlowConfig;

  constructor(flow: FlowConfig) {
    this.flow = flow;
  }

  getFlow(): FlowConfig {
    return this.flow;
  }

  getFirstStep(): Step {
    const first = this.flow.steps[0];
    if (!first) throw new Error("Flow has no steps");
    return first;
  }

  getStepById(stepId: string): Step | undefined {
    return this.flow.steps.find((s) => s.id === stepId);
  }

  getVisibleSteps(answers: Record<string, unknown>): Step[] {
    return this.flow.steps.filter((step) => isStepVisible(step.visibilityRules, answers));
  }

  resolveNextStepId(step: Step, answers: Record<string, unknown>): string | null {
    if (step.nextRules && step.nextRules.length > 0) {
      const ruleResult = evaluateNextStep(step.nextRules, answers);
      if (ruleResult !== null) return ruleResult;
    }
    return step.defaultNextStepId ?? null;
  }

  resolvePreviousStepId(currentStepId: string, answers: Record<string, unknown>): string | null {
    const visibleSteps = this.getVisibleSteps(answers);
    const idx = visibleSteps.findIndex((s) => s.id === currentStepId);
    if (idx <= 0) return null;
    return visibleSteps[idx - 1]?.id ?? null;
  }

  buildStepResult(stepId: string, answers: Record<string, unknown>): StepResult {
    const step = this.getStepById(stepId);
    if (!step) throw new Error(`Step not found: ${stepId}`);

    const visibleSteps = this.getVisibleSteps(answers);
    const idx = visibleSteps.findIndex((s) => s.id === stepId);
    const totalVisible = visibleSteps.length;

    const nextStepId = this.resolveNextStepId(step, answers);
    const previousStepId = this.resolvePreviousStepId(stepId, answers);

    return {
      stepId,
      step,
      isFirst: idx === 0,
      isLast: step.type === "complete" || nextStepId === null,
      previousStepId,
      nextStepId,
      progress: totalVisible > 0 ? Math.round(((idx + 1) / totalVisible) * 100) : 0,
    };
  }

  submitAnswer(
    state: OnboardingState,
    stepAnswers: Record<string, unknown>,
  ): SubmitAnswerResult {
    const step = this.getStepById(state.currentStepId);
    if (!step) throw new Error(`Step not found: ${state.currentStepId}`);

    const mergedAnswers = { ...state.answers, ...stepAnswers };
    const nextStepId = this.resolveNextStepId(step, mergedAnswers);
    const isComplete = step.type === "complete" || nextStepId === null;

    const completedStepIds = Array.from(new Set([...state.completedStepIds, step.id]));

    const newState: OnboardingState = {
      ...state,
      answers: mergedAnswers,
      currentStepId: nextStepId ?? step.id,
      status: isComplete ? "completed" : "in_progress",
      completedStepIds,
    };

    const nextStep = nextStepId ? this.buildStepResult(nextStepId, mergedAnswers) : null;

    return { nextStep, isComplete, state: newState };
  }

  initializeSession(sessionId: number): OnboardingState {
    const firstStep = this.getFirstStep();
    return {
      sessionId,
      flowId: this.flow.id,
      flowVersion: this.flow.version,
      currentStepId: firstStep.id,
      answers: {},
      status: "in_progress",
      completedStepIds: [],
    };
  }
}
