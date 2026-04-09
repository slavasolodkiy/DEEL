import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const complianceItemsTable = pgTable("compliance_items", {
  id: serial("id").primaryKey(),
  workerId: integer("worker_id").notNull(),
  organizationId: integer("organization_id").notNull(),
  documentType: text("document_type").notNull(),
  status: text("status").notNull().default("pending"),
  country: text("country").notNull(),
  notes: text("notes"),
  expiresAt: text("expires_at"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertComplianceItemSchema = createInsertSchema(complianceItemsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertComplianceItem = z.infer<typeof insertComplianceItemSchema>;
export type ComplianceItem = typeof complianceItemsTable.$inferSelect;
