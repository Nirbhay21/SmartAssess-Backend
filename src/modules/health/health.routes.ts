import { Router } from "express";

import { env } from "../../config/env.schema.ts";

const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV || "development",
  });
});

export default healthRouter;
