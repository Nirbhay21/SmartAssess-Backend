import { relations, sql } from "drizzle-orm";
import { pgPolicy, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { userTable } from "../auth/auth.schema.ts";
import { recruiterProfileTagTable } from "./recruiter-profile-tag.schema.ts";

export const recruiterProfileTable = pgTable(
  "recruiter_profile",
  {
    userId: text("user_id")
      .primaryKey()
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    organizationName: text("organization_name").notNull(),
    organizationSize: text("organization_size").notNull(),
    industry: text("industry").notNull(),
    countryCode: text("country_code").notNull(),

    organizationWebsite: text("organization_website"),

    // LLM setup fields
    llmProvider: text("llm_provider").notNull(),
    llmApiKey: text("llm_api_key").notNull(),
    defaultModel: text("default_model"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  () => [
    // Single policy covering select/insert/update/delete for profile owner
    pgPolicy("Users can manage their recruiter profile", {
      for: "all",
      to: "app_user",
      using: sql`(user_id = current_setting('app.current_user_id', true))`,
      withCheck: sql`(user_id = current_setting('app.current_user_id', true))`,
    }),
  ]
);

export const recruiterProfileRelations = relations(recruiterProfileTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [recruiterProfileTable.userId],
    references: [userTable.id],
  }),
  tags: many(recruiterProfileTagTable),
}));
