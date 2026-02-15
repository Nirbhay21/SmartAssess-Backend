import "express";

import type { AuthSession } from "../modules/auth/auth.types.ts";

declare module "express" {
  interface Request {
    auth?: AuthSession;
  }
}
