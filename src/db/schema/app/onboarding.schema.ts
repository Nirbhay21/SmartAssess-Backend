import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import type { CandidateOnboardingDraftData } from "../../../lib/validation/candidate-onboarding.schema.ts";
import { userTable } from "../auth/auth.schema.ts";

export const userOnboardingTable = pgTable(
  "user_onboarding",
  {
    userId: text("user_id")
      .primaryKey()
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    isCompleted: boolean("is_completed").default(false).notNull(),
    currentStep: integer("current_step").default(1).notNull(),
    draft: jsonb("draft").$type<CandidateOnboardingDraftData | null>(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("user_onboarding_userId_idx").on(table.userId),
    pgPolicy("Users can see their own onboarding", {
      for: "select",
      to: "app_user",
      using: sql`(user_id = current_setting('app.current_user_id', true))`,
    }),
    pgPolicy("Users can insert their own onboarding", {
      for: "insert",
      to: "app_user",
      withCheck: sql`(user_id = current_setting('app.current_user_id', true))`,
    }),
    pgPolicy("Users can update their own onboarding", {
      for: "update",
      to: "app_user",
      using: sql`(user_id = current_setting('app.current_user_id', true))`,
      withCheck: sql`(user_id = current_setting('app.current_user_id', true))`,
    }),
    pgPolicy("Users can delete their own onboarding", {
      for: "delete",
      to: "app_user",
      using: sql`(user_id = current_setting('app.current_user_id', true))`,
    }),
  ]
);

export const userOnboardingRelations = relations(userOnboardingTable, ({ one }) => ({
  user: one(userTable, {
    fields: [userOnboardingTable.userId],
    references: [userTable.id],
  }),
}));
