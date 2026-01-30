import { boolean, integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const tasksTable = pgTable("tasks", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 256 }).notNull(),
  completed: boolean().notNull().default(false),
});
