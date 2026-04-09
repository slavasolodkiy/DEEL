import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contractsTable = pgTable("contracts", {
  id: serial("id").primaryKey(),
  workerId: integer("worker_id").notNull(),
  organizationId: integer("organization_id").notNull(),
  title: text("title").notNull(),
  contractType: text("contract_type").notNull().default("full_time"),
  status: text("status").notNull().default("draft"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  currency: text("currency").notNull().default("USD"),
  compensation: numeric("compensation", { precision: 12, scale: 2 }).notNull(),
  compensationPeriod: text("compensation_period").notNull().default("monthly"),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertContractSchema = createInsertSchema(contractsTable).omit({ id: true, createdAt: true, updatedAt: true, signedAt: true });
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contractsTable.$inferSelect;
