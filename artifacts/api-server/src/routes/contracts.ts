import { Router, type IRouter } from "express";
import { db, contractsTable } from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";
import {
  ListContractsResponse,
  ListContractsQueryParams,
  GetContractParams,
  GetContractResponse,
  CreateContractBody,
  UpdateContractParams,
  UpdateContractBody,
  UpdateContractResponse,
  SignContractParams,
  SignContractResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const toContractObj = (c: typeof contractsTable.$inferSelect) => ({
  ...c,
  compensation: Number(c.compensation),
  signedAt: c.signedAt ? c.signedAt.toISOString() : null,
});

router.get("/contracts", async (req, res): Promise<void> => {
  const query = ListContractsQueryParams.safeParse(req.query);
  const conditions: SQL[] = [];
  if (query.success) {
    if (query.data.status) conditions.push(eq(contractsTable.status, query.data.status));
    if (query.data.workerId) conditions.push(eq(contractsTable.workerId, query.data.workerId));
  }
  const contracts = conditions.length
    ? await db.select().from(contractsTable).where(and(...conditions)).orderBy(contractsTable.createdAt)
    : await db.select().from(contractsTable).orderBy(contractsTable.createdAt);
  res.json(ListContractsResponse.parse(contracts.map(toContractObj)));
});

router.post("/contracts", async (req, res): Promise<void> => {
  const parsed = CreateContractBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { compensation, startDate, ...contractRest } = parsed.data;
  const [contract] = await db.insert(contractsTable).values({
    ...contractRest,
    compensation: String(compensation),
    startDate: startDate instanceof Date ? startDate.toISOString().split("T")[0]! : String(startDate),
  }).returning();
  res.status(201).json(GetContractResponse.parse(toContractObj(contract)));
});

router.get("/contracts/:id", async (req, res): Promise<void> => {
  const params = GetContractParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [contract] = await db.select().from(contractsTable).where(eq(contractsTable.id, params.data.id));
  if (!contract) {
    res.status(404).json({ error: "Contract not found" });
    return;
  }
  res.json(GetContractResponse.parse(toContractObj(contract)));
});

router.patch("/contracts/:id", async (req, res): Promise<void> => {
  const params = UpdateContractParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateContractBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { compensation: updateComp, ...updateContractRest } = parsed.data;
  const [contract] = await db.update(contractsTable).set({ ...updateContractRest, ...(updateComp != null ? { compensation: String(updateComp) } : {}) }).where(eq(contractsTable.id, params.data.id)).returning();
  if (!contract) {
    res.status(404).json({ error: "Contract not found" });
    return;
  }
  res.json(UpdateContractResponse.parse(toContractObj(contract)));
});

router.post("/contracts/:id/sign", async (req, res): Promise<void> => {
  const params = SignContractParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [contract] = await db
    .update(contractsTable)
    .set({ status: "active", signedAt: new Date() })
    .where(eq(contractsTable.id, params.data.id))
    .returning();
  if (!contract) {
    res.status(404).json({ error: "Contract not found" });
    return;
  }
  res.json(SignContractResponse.parse(toContractObj(contract)));
});

export default router;
