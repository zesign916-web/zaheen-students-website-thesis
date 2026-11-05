import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const communityQuestions = pgTable("community_questions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  section: text("section").notNull(),
  userId: text("user_id").notNull(),
  userName: text("user_name"),
  aiAnswer: text("ai_answer"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type CommunityQuestion = typeof communityQuestions.$inferSelect;
