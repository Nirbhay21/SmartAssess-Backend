import { toNodeHandler } from "better-auth/node";
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env.schema.ts";
import { db } from "./db/index.ts";
import { userTable } from "./db/schema/auth/auth.schema.ts";
import authRouter from "./modules/auth/auth.routes.ts";
import healthRouter from "./modules/health/health.routes.ts";
import onboardingRouter from "./modules/onboarding/onboarding.routes.ts";
import { auth } from "./shared/auth/auth.ts";
import { errorHandler } from "./shared/middlewares/error-handler.middleware.ts";

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

app.use("/api", healthRouter);
app.use("/api", authRouter);
app.use("/api", onboardingRouter);

app.use(errorHandler);

export default app;
