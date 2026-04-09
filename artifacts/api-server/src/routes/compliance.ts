import { Router, type IRouter } from "express";
import { db, complianceItemsTable } from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";
import {
  ListComplianceItemsResponse,
  ListComplianceItemsQueryParams,
  GetComplianceItemParams,
  GetComplianceItemResponse,
  CreateComplianceItemBody,
  UpdateComplianceItemParams,
  UpdateComplianceItemBody,
  UpdateComplianceItemResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/compliance", async (req, res): Promise<void> => {
  const query = ListComplianceItemsQueryParams.safeParse(req.query);
  const conditions: SQL[] = [];
  if (query.success) {
    if (query.data.status) conditions.push(eq(complianceItemsTable.status, query.data.status));
    if (query.data.workerId) conditions.push(eq(complianceItemsTable.workerId, query.data.workerId));
  }
  const items = conditions.length
    ? await db.select().from(complianceItemsTable).where(and(...conditions)).orderBy(complianceItemsTable.createdAt)
    : await db.select().from(complianceItemsTable).orderBy(complianceItemsTable.createdAt);
  res.json(ListComplianceItemsResponse.parse(items));
});

router.post("/compliance", async (req, res): Promise<void> => {
  const parsed = CreateComplianceItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [item] = await db.insert(complianceItemsTable).values(parsed.data).returning();
  res.status(201).json(GetComplianceItemResponse.parse(item));
});

router.get("/compliance/:id", async (req, res): Promise<void> => {
  const params = GetComplianceItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [item] = await db.select().from(complianceItemsTable).where(eq(complianceItemsTable.id, params.data.id));
  if (!item) {
    res.status(404).json({ error: "Compliance item not found" });
    return;
  }
  res.json(GetComplianceItemResponse.parse(item));
});

router.patch("/compliance/:id", async (req, res): Promise<void> => {
  const params = UpdateComplianceItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateComplianceItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [item] = await db.update(complianceItemsTable).set(parsed.data).where(eq(complianceItemsTable.id, params.data.id)).returning();
  if (!item) {
    res.status(404).json({ error: "Compliance item not found" });
    return;
  }
  res.json(UpdateComplianceItemResponse.parse(item));
});

export default router;
