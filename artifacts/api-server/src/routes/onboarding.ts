import { Router, type IRouter } from "express";
import { db, onboardingTasksTable } from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";
import {
  ListOnboardingTasksResponse,
  ListOnboardingTasksQueryParams,
  CreateOnboardingTaskBody,
  UpdateOnboardingTaskParams,
  UpdateOnboardingTaskBody,
  UpdateOnboardingTaskResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const toTaskObj = (t: typeof onboardingTasksTable.$inferSelect) => ({
  ...t,
  completedAt: t.completedAt ? t.completedAt.toISOString() : null,
});

router.get("/onboarding", async (req, res): Promise<void> => {
  const query = ListOnboardingTasksQueryParams.safeParse(req.query);
  const conditions: SQL[] = [];
  if (query.success) {
    if (query.data.workerId) conditions.push(eq(onboardingTasksTable.workerId, query.data.workerId));
    if (query.data.status) conditions.push(eq(onboardingTasksTable.status, query.data.status));
  }
  const tasks = conditions.length
    ? await db.select().from(onboardingTasksTable).where(and(...conditions)).orderBy(onboardingTasksTable.createdAt)
    : await db.select().from(onboardingTasksTable).orderBy(onboardingTasksTable.createdAt);
  res.json(ListOnboardingTasksResponse.parse(tasks.map(toTaskObj)));
});

router.post("/onboarding", async (req, res): Promise<void> => {
  const parsed = CreateOnboardingTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [task] = await db.insert(onboardingTasksTable).values(parsed.data).returning();
  res.status(201).json(toTaskObj(task));
});

router.patch("/onboarding/:id", async (req, res): Promise<void> => {
  const params = UpdateOnboardingTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateOnboardingTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updates: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "completed") {
    updates.completedAt = new Date();
  }
  const [task] = await db.update(onboardingTasksTable).set(updates).where(eq(onboardingTasksTable.id, params.data.id)).returning();
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(UpdateOnboardingTaskResponse.parse(toTaskObj(task)));
});

export default router;
