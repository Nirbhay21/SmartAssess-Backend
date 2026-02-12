import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { candidateProfileTable } from "./candidate-profile.schema.ts";
import { tagTable } from "./tag.schema.ts";

export const candidateProfileTagTable = pgTable(
  "candidate_profile_tag",
  {
    candidateUserId: text("candidate_user_id")
      .notNull()
      .references(() => candidateProfileTable.userId, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tagTable.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // composite primary key (candidate_user_id, tag_id)
    primaryKey({ columns: [table.candidateUserId, table.tagId] }),
    index("candidate_profile_tag_tagId_idx").on(table.tagId),
    // Single policy covering select/insert/update/delete for profile owner
    pgPolicy("Users can manage their profile tags", {
      for: "all",
      to: "app_user",
      using: sql`(candidate_user_id = current_setting('app.current_user_id', true))`,
      withCheck: sql`(candidate_user_id = current_setting('app.current_user_id', true))`,
    }),
  ]
);

export const candidateProfileTagRelations = relations(candidateProfileTagTable, ({ one }) => ({
  candidate: one(candidateProfileTable, {
    fields: [candidateProfileTagTable.candidateUserId],
    references: [candidateProfileTable.userId],
  }),
  tag: one(tagTable, {
    fields: [candidateProfileTagTable.tagId],
    references: [tagTable.id],
  }),
}));
