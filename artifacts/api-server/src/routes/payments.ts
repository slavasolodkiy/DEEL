import { Router, type IRouter } from "express";
import { db, paymentsTable } from "@workspace/db";
import { eq, and, SQL } from "drizzle-orm";
import {
  ListPaymentsResponse,
  ListPaymentsQueryParams,
  GetPaymentParams,
  GetPaymentResponse,
  CreatePaymentBody,
  ApprovePaymentParams,
  ApprovePaymentResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const toPaymentObj = (p: typeof paymentsTable.$inferSelect) => ({
  ...p,
  amount: Number(p.amount),
  processedAt: p.processedAt ? p.processedAt.toISOString() : null,
});

router.get("/payments", async (req, res): Promise<void> => {
  const query = ListPaymentsQueryParams.safeParse(req.query);
  const conditions: SQL[] = [];
  if (query.success) {
    if (query.data.status) conditions.push(eq(paymentsTable.status, query.data.status));
    if (query.data.workerId) conditions.push(eq(paymentsTable.workerId, query.data.workerId));
  }
  const payments = conditions.length
    ? await db.select().from(paymentsTable).where(and(...conditions)).orderBy(paymentsTable.createdAt)
    : await db.select().from(paymentsTable).orderBy(paymentsTable.createdAt);
  res.json(ListPaymentsResponse.parse(payments.map(toPaymentObj)));
});

router.post("/payments", async (req, res): Promise<void> => {
  const parsed = CreatePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { amount, ...paymentRest } = parsed.data;
  const [payment] = await db.insert(paymentsTable).values({ ...paymentRest, amount: String(amount) }).returning();
  res.status(201).json(GetPaymentResponse.parse(toPaymentObj(payment)));
});

router.get("/payments/:id", async (req, res): Promise<void> => {
  const params = GetPaymentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, params.data.id));
  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }
  res.json(GetPaymentResponse.parse(toPaymentObj(payment)));
});

router.post("/payments/:id/approve", async (req, res): Promise<void> => {
  const params = ApprovePaymentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [payment] = await db
    .update(paymentsTable)
    .set({ status: "processing", processedAt: new Date() })
    .where(eq(paymentsTable.id, params.data.id))
    .returning();
  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }
  res.json(ApprovePaymentResponse.parse(toPaymentObj(payment)));
});

export default router;
