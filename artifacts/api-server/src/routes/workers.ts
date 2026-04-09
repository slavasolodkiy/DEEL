import { Router, type IRouter } from "express";
import { db, workersTable } from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";
import {
  ListWorkersResponse,
  ListWorkersQueryParams,
  GetWorkerParams,
  GetWorkerResponse,
  CreateWorkerBody,
  UpdateWorkerParams,
  UpdateWorkerBody,
  UpdateWorkerResponse,
  DeleteWorkerParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/workers", async (req, res): Promise<void> => {
  const query = ListWorkersQueryParams.safeParse(req.query);
  const conditions: SQL[] = [];
  if (query.success) {
    if (query.data.status) conditions.push(eq(workersTable.status, query.data.status));
    if (query.data.type) conditions.push(eq(workersTable.workerType, query.data.type));
    if (query.data.country) conditions.push(eq(workersTable.country, query.data.country));
  }
  const workers = conditions.length
    ? await db.select().from(workersTable).where(and(...conditions)).orderBy(workersTable.lastName)
    : await db.select().from(workersTable).orderBy(workersTable.lastName);
  res.json(ListWorkersResponse.parse(workers.map(w => ({ ...w, salary: w.salary ? Number(w.salary) : null }))));
});

router.post("/workers", async (req, res): Promise<void> => {
  const parsed = CreateWorkerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [worker] = await db.insert(workersTable).values(parsed.data).returning();
  res.status(201).json(GetWorkerResponse.parse({ ...worker, salary: worker.salary ? Number(worker.salary) : null }));
});

router.get("/workers/:id", async (req, res): Promise<void> => {
  const params = GetWorkerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [worker] = await db.select().from(workersTable).where(eq(workersTable.id, params.data.id));
  if (!worker) {
    res.status(404).json({ error: "Worker not found" });
    return;
  }
  res.json(GetWorkerResponse.parse({ ...worker, salary: worker.salary ? Number(worker.salary) : null }));
});

router.patch("/workers/:id", async (req, res): Promise<void> => {
  const params = UpdateWorkerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateWorkerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [worker] = await db.update(workersTable).set(parsed.data).where(eq(workersTable.id, params.data.id)).returning();
  if (!worker) {
    res.status(404).json({ error: "Worker not found" });
    return;
  }
  res.json(UpdateWorkerResponse.parse({ ...worker, salary: worker.salary ? Number(worker.salary) : null }));
});

router.delete("/workers/:id", async (req, res): Promise<void> => {
  const params = DeleteWorkerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [worker] = await db.update(workersTable).set({ status: "terminated" }).where(eq(workersTable.id, params.data.id)).returning();
  if (!worker) {
    res.status(404).json({ error: "Worker not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
