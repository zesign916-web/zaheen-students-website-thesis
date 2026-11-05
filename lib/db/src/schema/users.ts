import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  province: text("province"),
  avatarUrl: text("avatar_url"),
  birthday: text("birthday"),
  tagline: text("tagline"),
  gender: text("gender"),
  genderCustom: text("gender_custom"),
  authProvider: text("auth_provider").default("email"),
  providerUserId: text("provider_user_id"),
  isGuest: boolean("is_guest").default(false),
  agreedToTerms: boolean("agreed_to_terms").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
