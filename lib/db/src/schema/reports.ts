import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  reviewId: integer("review_id"),
  messageContent: text("message_content").notNull(),
  additionalNote: text("additional_note"),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
