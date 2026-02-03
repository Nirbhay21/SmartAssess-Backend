import { relations, sql } from "drizzle-orm";
import { boolean, index, pgPolicy, pgSchema, text, timestamp } from "drizzle-orm/pg-core";

export const authSchema = pgSchema("auth");

export const userRoleEnum = authSchema.enum("user_role", ["candidate", "recruiter", "admin"]);

export const userTable = authSchema.table(
  "user",
  {
    id: text("id").primaryKey(),

    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    image: text("image"),

    role: userRoleEnum("role").notNull(),

    emailVerified: boolean("email_verified").default(false).notNull(),
    termsAccepted: boolean("terms_accepted").notNull(),
    termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
    termsAcceptedVersion: text("terms_accepted_version"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  () => [
    pgPolicy("System can see all users", {
      for: "select",
      to: "app_user",
      using: sql`true`,
    }),
    pgPolicy("System can insert new users", {
      for: "insert",
      to: "app_user",
      withCheck: sql`true`,
    }),
    pgPolicy("Users can delete their own profile", {
      for: "delete",
      to: "app_user",
      using: sql`(id = current_setting('app.current_user_id'::text, true))`,
    }),
    pgPolicy("Users can update their own profile", {
      for: "update",
      to: "app_user",
      using: sql`(id = current_setting('app.current_user_id'::text, true))`,
      withCheck: sql`(id = current_setting('app.current_user_id'::text, true))`,
    }),
  ]
);

export const sessionTable = authSchema.table(
  "session",
  {
    id: text("id").primaryKey(),

    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("session_userId_idx").on(table.userId),
    pgPolicy("System can see all sessions", {
      for: "select",
      to: "app_user",
      using: sql`true`,
    }),
    pgPolicy("Users can delete their own sessions", {
      for: "delete",
      to: "app_user",
      using: sql`(user_id = current_setting('app.current_user_id'::text, true))`,
    }),
    pgPolicy("Users can update their own sessions", {
      for: "update",
      to: "app_user",
      using: sql`(user_id = current_setting('app.current_user_id'::text, true))`,
    }),
    pgPolicy("System can create sessions during signup", {
      for: "insert",
      to: "app_user",
      withCheck: sql`true`,
    }),
  ]
);

export const accountTable = authSchema.table(
  "account",
  {
    id: text("id").primaryKey(),

    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    providerId: text("provider_id").notNull(),
    accountId: text("account_id").notNull(),

    password: text("password"),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),

    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),

    scope: text("scope"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("account_userId_idx").on(table.userId),
    pgPolicy("Users can update their own accounts", {
      for: "update",
      to: "app_user",
      using: sql`(user_id = current_setting('app.current_user_id'::text, true))`,
    }),
    pgPolicy("System can insert all accounts", {
      for: "insert",
      to: "app_user",
      withCheck: sql`true`,
    }),
    pgPolicy("System can see all accounts", {
      for: "select",
      to: "app_user",
      using: sql`true`,
    }),
    pgPolicy("Users can delete their own accounts", {
      for: "delete",
      to: "app_user",
      using: sql`(user_id = current_setting('app.current_user_id'::text, true))`,
    }),
  ]
);

export const verificationTable = authSchema.table(
  "verification",
  {
    id: text("id").primaryKey(),

    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("verification_identifier_idx").on(table.identifier),
    pgPolicy("App user can manage verification tokens", {
      for: "all",
      to: "app_user",
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ]
);

export const userRelations = relations(userTable, ({ many }) => ({
  sessions: many(sessionTable),
  accounts: many(accountTable),
}));

export const sessionRelations = relations(sessionTable, ({ one }) => ({
  user: one(userTable, {
    fields: [sessionTable.userId],
    references: [userTable.id],
  }),
}));

export const accountRelations = relations(accountTable, ({ one }) => ({
  user: one(userTable, {
    fields: [accountTable.userId],
    references: [userTable.id],
  }),
}));
