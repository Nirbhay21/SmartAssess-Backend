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

import { recruiterProfileTable } from "./recruiter-profile.schema.ts";
import { tagTable } from "./tag.schema.ts";

export const recruiterProfileTagTable = pgTable(
  "recruiter_profile_tag",
  {
    recruiterUserId: text("recruiter_user_id")
      .notNull()
      .references(() => recruiterProfileTable.userId, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tagTable.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // composite primary key (recruiter_user_id, tag_id)
    primaryKey({ columns: [table.recruiterUserId, table.tagId] }),
    index("recruiter_profile_tag_tagId_idx").on(table.tagId),
    // Single policy covering select/insert/update/delete for recruiter owner
    pgPolicy("Users can manage their recruiter tags", {
      for: "all",
      to: "app_user",
      using: sql`(recruiter_user_id = current_setting('app.current_user_id', true))`,
      withCheck: sql`(recruiter_user_id = current_setting('app.current_user_id', true))`,
    }),
  ]
);

export const recruiterProfileTagRelations = relations(recruiterProfileTagTable, ({ one }) => ({
  recruiter: one(recruiterProfileTable, {
    fields: [recruiterProfileTagTable.recruiterUserId],
    references: [recruiterProfileTable.userId],
  }),
  tag: one(tagTable, {
    fields: [recruiterProfileTagTable.tagId],
    references: [tagTable.id],
  }),
}));
