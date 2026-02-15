import { sql } from "drizzle-orm";

import { db } from "./index.js";

export type TransactionType = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const createUserContext = (userId: string) => {
  return {
    withRls: async <T>(fn: (tx: TransactionType) => Promise<T>) => {
      return db.transaction(async (tx) => {
        await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
        return fn(tx);
      });
    },
  };
};
