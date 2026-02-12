import { relations, sql } from "drizzle-orm";
import { index, integer, pgPolicy, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { candidateProfileTagTable } from "./candidate_profile_tag.schema.ts";
import { recruiterProfileTagTable } from "./recruiter_profile_tag.schema.ts";

export const tagTable = pgTable(
  "tag",
  {
    // Auto-incrementing integer primary key using PostgreSQL identity
    id: integer("id").generatedByDefaultAsIdentity().primaryKey().notNull(),
    name: text("name").notNull().unique(),
    type: text("type").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("tag_name_idx").on(table.name),
    index("tag_type_idx").on(table.type),

    // RLS: allow any authenticated `app_user` to read tags, but only admins may create/update/delete
    pgPolicy("App users can select tags", {
      for: "select",
      to: "app_user",
      using: sql`true`,
    }),

    pgPolicy("Admins can manage tags", {
      for: "all",
      to: "app_user",
      using: sql`EXISTS (SELECT 1 FROM auth."user" u WHERE u.id = current_setting('app.current_user_id', true) AND u.role = 'admin')`,
      withCheck: sql`EXISTS (SELECT 1 FROM auth."user" u WHERE u.id = current_setting('app.current_user_id', true) AND u.role = 'admin')`,
    }),
  ]
);

export const tagRelations = relations(tagTable, ({ many }) => ({
  candidateProfileTags: many(candidateProfileTagTable),
  recruiterProfileTags: many(recruiterProfileTagTable),
}));
