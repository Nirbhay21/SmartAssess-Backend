import { toNodeHandler } from "better-auth/node";
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { db } from "./db/index.ts";
import { userTable } from "./db/schema/auth/auth.schema.ts";
import { auth } from "./lib/auth/auth.ts";
import { env } from "./lib/validation/env.schema.ts";
import { errorHandler } from "./middlewares/error-handler.middleware.ts";
import authRouter from "./routes/auth.routes.ts";
import healthRouter from "./routes/health.routes.ts";
import onboardingRouter from "./routes/onboarding.routes.ts";

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
