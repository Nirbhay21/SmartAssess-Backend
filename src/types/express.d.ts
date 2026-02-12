import "express";

import type { AuthSession } from "./auth.types.ts";

declare module "express" {
  interface Request {
    auth?: AuthSession;
  }
}
