import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const onboardingSessionsTable = pgTable("onboarding_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  flowId: text("flow_id").notNull(),
  flowVersion: text("flow_version").notNull().default("v1"),
  currentStepId: text("current_step_id").notNull(),
  answers: jsonb("answers").notNull().default({}),
  status: text("status").notNull().default("in_progress"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const onboardingStepLogTable = pgTable("onboarding_step_log", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  stepId: text("step_id").notNull(),
  answers: jsonb("answers").notNull().default({}),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOnboardingSessionSchema = createInsertSchema(onboardingSessionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOnboardingSession = z.infer<typeof insertOnboardingSessionSchema>;
export type OnboardingSession = typeof onboardingSessionsTable.$inferSelect;
export type OnboardingStepLog = typeof onboardingStepLogTable.$inferSelect;
