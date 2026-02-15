import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "../config/env.schema.ts";
import * as schema from "./schema/index.ts";

const client = postgres(env.DATABASE_APP_USER_URL, {
  prepare: false,
  ssl: "require",
});

export const db = drizzle(client, { schema });
