import type { NextFunction, Request, Response } from "express";

import { ApplicationError } from "../lib/errors/application-error.ts";
import { ValidationError } from "../lib/errors/validation-error.ts";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  // Controlled application errors
  if (err instanceof ApplicationError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details ?? null,
    });
  }

  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: err.message,
      details: err.details ?? null,
    });
  }

  console.error("Unexpected Error:", err);

  return res.status(500).json({
    error: "Internal Server Error",
  });
}
