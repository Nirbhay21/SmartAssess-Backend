import { relations } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { candidateProfileTagTable } from "./candidate-profile-tag.schema.ts";
import { recruiterProfileTagTable } from "./recruiter-profile-tag.schema.ts";

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
  (table) => [index("tag_name_idx").on(table.name), index("tag_type_idx").on(table.type)]
);

export const tagRelations = relations(tagTable, ({ many }) => ({
  candidateProfileTags: many(candidateProfileTagTable),
  recruiterProfileTags: many(recruiterProfileTagTable),
}));
