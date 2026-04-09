import { Router, type IRouter } from "express";
import { db, workersTable, contractsTable, paymentsTable, complianceItemsTable, notificationsTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import {
  GetDashboardSummaryResponse,
  GetPayrollTimelineResponse,
  GetWorkersByCountryResponse,
  GetRecentActivityResponse,
  GetComplianceOverviewResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [workerCounts] = await db
    .select({
      total: count(),
      active: sql<number>`count(*) filter (where status = 'active')`,
      onboarding: sql<number>`count(*) filter (where status = 'onboarding')`,
    })
    .from(workersTable);

  const [contractCounts] = await db
    .select({
      total: count(),
      active: sql<number>`count(*) filter (where status = 'active')`,
    })
    .from(contractsTable);

  const [paymentPending] = await db
    .select({ count: count() })
    .from(paymentsTable)
    .where(eq(paymentsTable.status, "pending"));

  const [payrollThisMonth] = await db
    .select({ total: sql<number>`coalesce(sum(amount), 0)` })
    .from(paymentsTable)
    .where(sql`date_trunc('month', created_at) = date_trunc('month', now())`);

  const [complianceAlerts] = await db
    .select({ count: count() })
    .from(complianceItemsTable)
    .where(sql`status in ('pending', 'expired', 'rejected')`);

  const [unreadNotifs] = await db
    .select({ count: count() })
    .from(notificationsTable)
    .where(eq(notificationsTable.isRead, false));

  const countriesResult = await db
    .select({ country: workersTable.country })
    .from(workersTable)
    .groupBy(workersTable.country);

  const summary = {
    totalWorkers: Number(workerCounts?.total ?? 0),
    activeWorkers: Number(workerCounts?.active ?? 0),
    onboardingWorkers: Number(workerCounts?.onboarding ?? 0),
    totalContracts: Number(contractCounts?.total ?? 0),
    activeContracts: Number(contractCounts?.active ?? 0),
    pendingPayments: Number(paymentPending?.count ?? 0),
    totalPayrollThisMonth: Number(payrollThisMonth?.total ?? 0),
    complianceAlerts: Number(complianceAlerts?.count ?? 0),
    unreadNotifications: Number(unreadNotifs?.count ?? 0),
    countriesCount: countriesResult.length,
  };

  res.json(GetDashboardSummaryResponse.parse(summary));
});

router.get("/dashboard/payroll-timeline", async (_req, res): Promise<void> => {
  const timeline = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', created_at), 'YYYY-MM')`,
      totalAmount: sql<number>`coalesce(sum(amount), 0)`,
      workerCount: sql<number>`count(distinct worker_id)`,
    })
    .from(paymentsTable)
    .where(sql`created_at >= now() - interval '12 months'`)
    .groupBy(sql`date_trunc('month', created_at)`)
    .orderBy(sql`date_trunc('month', created_at)`);

  res.json(GetPayrollTimelineResponse.parse(timeline.map(r => ({
    month: r.month,
    totalAmount: Number(r.totalAmount),
    workerCount: Number(r.workerCount),
  }))));
});

router.get("/dashboard/workers-by-country", async (_req, res): Promise<void> => {
  const byCountry = await db
    .select({
      country: workersTable.country,
      count: count(),
      currency: workersTable.currency,
    })
    .from(workersTable)
    .where(eq(workersTable.status, "active"))
    .groupBy(workersTable.country, workersTable.currency)
    .orderBy(sql`count(*) desc`);

  res.json(GetWorkersByCountryResponse.parse(byCountry.map(r => ({
    country: r.country,
    count: Number(r.count),
    currency: r.currency,
  }))));
});

router.get("/dashboard/recent-activity", async (_req, res): Promise<void> => {
  const contracts = await db
    .select({
      id: contractsTable.id,
      type: sql<string>`'contract_signed'`,
      status: contractsTable.status,
      createdAt: contractsTable.createdAt,
      currency: contractsTable.currency,
      compensation: contractsTable.compensation,
    })
    .from(contractsTable)
    .orderBy(sql`created_at desc`)
    .limit(5);

  const payments = await db
    .select({
      id: paymentsTable.id,
      type: paymentsTable.paymentType,
      status: paymentsTable.status,
      createdAt: paymentsTable.createdAt,
      currency: paymentsTable.currency,
      amount: paymentsTable.amount,
    })
    .from(paymentsTable)
    .orderBy(sql`created_at desc`)
    .limit(5);

  const workers = await db
    .select({
      id: workersTable.id,
      firstName: workersTable.firstName,
      lastName: workersTable.lastName,
      country: workersTable.country,
      createdAt: workersTable.createdAt,
    })
    .from(workersTable)
    .orderBy(sql`created_at desc`)
    .limit(5);

  const activity = [
    ...contracts.map((c, i) => ({
      id: c.id + i * 1000,
      type: (c.status === "active" ? "contract_signed" : "contract_created") as "contract_signed" | "contract_created",
      description: c.status === "active" ? "Contract signed" : "Contract created",
      workerName: null,
      country: null,
      amount: Number(c.compensation),
      currency: c.currency,
      createdAt: c.createdAt.toISOString(),
    })),
    ...payments.map((p, i) => ({
      id: p.id + (i + 5) * 1000,
      type: (p.status === "failed" ? "payment_failed" : "payment_processed") as "payment_processed" | "payment_failed",
      description: p.status === "failed" ? "Payment failed" : "Payment processed",
      workerName: null,
      country: null,
      amount: Number(p.amount),
      currency: p.currency,
      createdAt: p.createdAt.toISOString(),
    })),
    ...workers.map((w, i) => ({
      id: w.id + (i + 10) * 1000,
      type: "worker_added" as "worker_added",
      description: `${w.firstName} ${w.lastName} added`,
      workerName: `${w.firstName} ${w.lastName}`,
      country: w.country,
      amount: null,
      currency: null,
      createdAt: w.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 15);

  res.json(GetRecentActivityResponse.parse(activity));
});

router.get("/dashboard/compliance-overview", async (_req, res): Promise<void> => {
  const [result] = await db
    .select({
      pending: sql<number>`count(*) filter (where status = 'pending')`,
      inReview: sql<number>`count(*) filter (where status = 'in_review')`,
      approved: sql<number>`count(*) filter (where status = 'approved')`,
      rejected: sql<number>`count(*) filter (where status = 'rejected')`,
      expired: sql<number>`count(*) filter (where status = 'expired')`,
      total: count(),
    })
    .from(complianceItemsTable);

  res.json(GetComplianceOverviewResponse.parse({
    pending: Number(result?.pending ?? 0),
    inReview: Number(result?.inReview ?? 0),
    approved: Number(result?.approved ?? 0),
    rejected: Number(result?.rejected ?? 0),
    expired: Number(result?.expired ?? 0),
    total: Number(result?.total ?? 0),
  }));
});

export default router;
