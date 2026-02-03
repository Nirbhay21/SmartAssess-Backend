import { toNodeHandler } from "better-auth/node";
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { db } from "./db/index.ts";
import { userTable } from "./db/schema/auth/auth.schema.ts";
import { auth } from "./lib/auth/auth.ts";
import { env } from "./lib/validation/env.schema.ts";

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use(express.json());

app.use(helmet());
app.use(compression());

app.get("/", async (_req, res) => {
  const result = await db.select().from(userTable);
  res.send({ message: "SmartAssess Server is running", users: result });
});

export default app;
