import { Router, type IRouter } from "express";
import { db, organizationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListOrganizationsResponse,
  GetOrganizationParams,
  GetOrganizationResponse,
  CreateOrganizationBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/organizations", async (req, res): Promise<void> => {
  const orgs = await db.select().from(organizationsTable).orderBy(organizationsTable.name);
  res.json(ListOrganizationsResponse.parse(orgs));
});

router.post("/organizations", async (req, res): Promise<void> => {
  const parsed = CreateOrganizationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [org] = await db.insert(organizationsTable).values(parsed.data).returning();
  res.status(201).json(GetOrganizationResponse.parse(org));
});

router.get("/organizations/:id", async (req, res): Promise<void> => {
  const params = GetOrganizationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.id, params.data.id));
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  res.json(GetOrganizationResponse.parse(org));
});

export default router;
