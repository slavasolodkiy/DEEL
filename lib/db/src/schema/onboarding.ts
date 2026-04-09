import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const onboardingTasksTable = pgTable("onboarding_tasks", {
  id: serial("id").primaryKey(),
  workerId: integer("worker_id").notNull(),
  organizationId: integer("organization_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("other"),
  status: text("status").notNull().default("pending"),
  dueDate: text("due_date"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertOnboardingTaskSchema = createInsertSchema(onboardingTasksTable).omit({ id: true, createdAt: true, updatedAt: true, completedAt: true });
export type InsertOnboardingTask = z.infer<typeof insertOnboardingTaskSchema>;
export type OnboardingTask = typeof onboardingTasksTable.$inferSelect;
