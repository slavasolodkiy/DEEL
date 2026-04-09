import { Router } from "express";
import { db } from "@workspace/db";
import { onboardingSessionsTable, onboardingStepLogTable } from "@workspace/db/schema";
import { getEngine, listFlows } from "@workspace/onboarding-engine";
import { eq } from "drizzle-orm";
import { optionalAuth } from "../middlewares/auth";

const router = Router();

// GET /api/onboarding-engine/flows
router.get("/onboarding-engine/flows", (_req, res): void => {
  res.json(listFlows());
});

// GET /api/onboarding-engine/flows/:flowId
router.get("/onboarding-engine/flows/:flowId", (req, res): void => {
  const { flowId } = req.params as { flowId: string };
  const version = (req.query["version"] as string | undefined) ?? "v1";
  try {
    const engine = getEngine(flowId, version);
    res.json(engine.getFlow());
  } catch {
    res.status(404).json({ error: "not_found", message: `Flow '${flowId}' version '${version}' not found` });
  }
});

// POST /api/onboarding-engine/sessions
router.post("/onboarding-engine/sessions", optionalAuth, async (req, res): Promise<void> => {
  const { flowId, flowVersion = "v1" } = req.body as {
    flowId?: string;
    flowVersion?: string;
  };

  if (!flowId) {
    res.status(400).json({ error: "validation", message: "flowId is required" });
    return;
  }

  let engine: ReturnType<typeof getEngine>;
  try {
    engine = getEngine(flowId, flowVersion);
  } catch {
    res.status(404).json({ error: "not_found", message: `Flow '${flowId}' version '${flowVersion}' not found` });
    return;
  }

  const [record] = await db
    .insert(onboardingSessionsTable)
    .values({
      userId: req.user?.id ?? null,
      flowId,
      flowVersion,
      currentStepId: engine.getFirstStep().id,
      answers: {},
      status: "in_progress",
    })
    .returning();

  const state = engine.initializeSession(record!.id);
  const currentStep = engine.buildStepResult(state.currentStepId, state.answers);

  res.status(201).json({ session: { ...state, id: record!.id }, currentStep });
});

// GET /api/onboarding-engine/sessions/:id
router.get("/onboarding-engine/sessions/:id", optionalAuth, async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);

  const [record] = await db
    .select()
    .from(onboardingSessionsTable)
    .where(eq(onboardingSessionsTable.id, id))
    .limit(1);

  if (!record) {
    res.status(404).json({ error: "not_found", message: "Session not found" });
    return;
  }

  if (record.userId !== null && req.user?.id !== record.userId) {
    res.status(403).json({ error: "forbidden", message: "You do not own this session" });
    return;
  }

  const engine = getEngine(record.flowId, record.flowVersion);
  const answers = (record.answers ?? {}) as Record<string, unknown>;
  const currentStep = engine.buildStepResult(record.currentStepId, answers);

  res.json({
    session: {
      id: record.id,
      flowId: record.flowId,
      flowVersion: record.flowVersion,
      currentStepId: record.currentStepId,
      answers,
      status: record.status,
    },
    currentStep,
  });
});

// POST /api/onboarding-engine/sessions/:id/answer
router.post("/onboarding-engine/sessions/:id/answer", optionalAuth, async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  const { answers: stepAnswers = {} } = req.body as { answers?: Record<string, unknown> };

  const [record] = await db
    .select()
    .from(onboardingSessionsTable)
    .where(eq(onboardingSessionsTable.id, id))
    .limit(1);

  if (!record) {
    res.status(404).json({ error: "not_found", message: "Session not found" });
    return;
  }

  if (record.userId !== null && req.user?.id !== record.userId) {
    res.status(403).json({ error: "forbidden", message: "You do not own this session" });
    return;
  }

  if (record.status === "completed") {
    res.status(400).json({ error: "already_complete", message: "This session is already completed" });
    return;
  }

  const engine = getEngine(record.flowId, record.flowVersion);
  const existingAnswers = (record.answers ?? {}) as Record<string, unknown>;

  const currentStep = engine.getStepById(record.currentStepId);
  if (currentStep) {
    const validation = engine.validateStepAnswers(currentStep, stepAnswers);
    if (!validation.valid) {
      res.status(400).json({
        error: "validation",
        message: "Required fields are missing",
        fields: validation.errors,
      });
      return;
    }
  }

  const state = {
    sessionId: record.id,
    flowId: record.flowId,
    flowVersion: record.flowVersion,
    currentStepId: record.currentStepId,
    answers: existingAnswers,
    status: record.status as "in_progress" | "completed" | "abandoned",
    completedStepIds: [],
  };

  const result = engine.submitAnswer(state, stepAnswers);

  await db.insert(onboardingStepLogTable).values({
    sessionId: id,
    stepId: record.currentStepId,
    answers: stepAnswers,
  });

  const updateData: Partial<typeof onboardingSessionsTable.$inferInsert> = {
    currentStepId: result.state.currentStepId,
    answers: result.state.answers,
    status: result.state.status,
  };
  if (result.isComplete) {
    updateData.completedAt = new Date();
  }
  await db.update(onboardingSessionsTable).set(updateData).where(eq(onboardingSessionsTable.id, id));

  res.json({
    nextStep: result.nextStep,
    isComplete: result.isComplete,
    session: { ...result.state, id },
  });
});

// POST /api/onboarding-engine/sessions/:id/back
router.post("/onboarding-engine/sessions/:id/back", optionalAuth, async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);

  const [record] = await db
    .select()
    .from(onboardingSessionsTable)
    .where(eq(onboardingSessionsTable.id, id))
    .limit(1);

  if (!record) {
    res.status(404).json({ error: "not_found", message: "Session not found" });
    return;
  }

  if (record.userId !== null && req.user?.id !== record.userId) {
    res.status(403).json({ error: "forbidden", message: "You do not own this session" });
    return;
  }

  const engine = getEngine(record.flowId, record.flowVersion);
  const answers = (record.answers ?? {}) as Record<string, unknown>;
  const prevStepId = engine.resolvePreviousStepId(record.currentStepId, answers);

  if (!prevStepId) {
    res.status(400).json({ error: "no_previous_step", message: "Already at first step" });
    return;
  }

  await db
    .update(onboardingSessionsTable)
    .set({ currentStepId: prevStepId })
    .where(eq(onboardingSessionsTable.id, id));

  const currentStep = engine.buildStepResult(prevStepId, answers);
  res.json({
    session: { id, flowId: record.flowId, flowVersion: record.flowVersion, currentStepId: prevStepId, answers, status: record.status },
    currentStep,
  });
});

export default router;
