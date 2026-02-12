import type { Request } from "express";

import type { AuthSession } from "../types/auth.types.ts";

export class UnauthorizedError extends Error {
  readonly statusCode = 401;

  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export const getAuth = (req: Request): AuthSession => {
  if (!req.auth) {
    throw new UnauthorizedError("Unauthorized: requireAuth middleware missing");
  }
  return req.auth;
};
