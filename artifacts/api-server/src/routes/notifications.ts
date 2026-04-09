import { Router, type IRouter } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, SQL } from "drizzle-orm";
import {
  ListNotificationsResponse,
  ListNotificationsQueryParams,
  MarkNotificationReadParams,
  MarkNotificationReadResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/notifications", async (req, res): Promise<void> => {
  const query = ListNotificationsQueryParams.safeParse(req.query);
  const conditions: SQL[] = [];
  if (query.success && query.data.unreadOnly) {
    conditions.push(eq(notificationsTable.isRead, false));
  }
  const items = conditions.length
    ? await db.select().from(notificationsTable).where(conditions[0]).orderBy(notificationsTable.createdAt)
    : await db.select().from(notificationsTable).orderBy(notificationsTable.createdAt);
  res.json(ListNotificationsResponse.parse(items));
});

router.post("/notifications/:id/read", async (req, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [item] = await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.id, params.data.id)).returning();
  if (!item) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  res.json(MarkNotificationReadResponse.parse(item));
});

router.post("/notifications/read-all", async (_req, res): Promise<void> => {
  await db.update(notificationsTable).set({ isRead: true });
  res.json({ success: true });
});

export default router;
