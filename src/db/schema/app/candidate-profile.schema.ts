import { relations, sql } from "drizzle-orm";
import { integer, pgPolicy, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { userTable } from "../auth/auth.schema.ts";
import { candidateProfileTagTable } from "./candidate-profile-tag.schema.ts";

export const candidateProfileTable = pgTable(
  "candidate_profile",
  {
    userId: text("user_id")
      .primaryKey()
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    domain: text("domain").notNull(),
    primaryRole: text("primary_role").notNull(),
    highestEducation: text("highest_education").notNull(),
    currentStatus: text("current_status").notNull(),

    // Stored as numeric min/max years. `yearsOfExperience` enum maps to these ranges (e.g., '1-2' => min=1, max=2).
    yearsOfExperienceMin: integer("years_of_experience_min").notNull(),
    yearsOfExperienceMax: integer("years_of_experience_max"),
    professionalBio: text("professional_bio").notNull(),

    country: text("country").notNull(),
    portfolioUrl: text("portfolio_url"),
    githubUrl: text("github_url"),
    linkedinUrl: text("linkedin_url"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  () => [
    // Single policy covering select/insert/update/delete for profile owner
    pgPolicy("Users can manage their candidate profile", {
      for: "all",
      to: "app_user",
      using: sql`(user_id = current_setting('app.current_user_id', true))`,
      withCheck: sql`(user_id = current_setting('app.current_user_id', true))`,
    }),
  ]
);

export const candidateProfileRelations = relations(candidateProfileTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [candidateProfileTable.userId],
    references: [userTable.id],
  }),
  tags: many(candidateProfileTagTable),
}));
