import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { ApplicationError } from "../errors/application-error.ts";
import { ValidationError } from "../errors/validation-error.ts";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
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

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Invalid request data",
      details: err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  console.error("Unexpected Error:", err);

  return res.status(500).json({
    error: "Internal Server Error",
  });
}
