import crypto from "crypto";

import { env } from "../config/env.schema.ts";
import type { AppMeta } from "../types/app-meta.ts";

function sign(value: string) {
  return crypto.createHmac("sha256", env.SECRET_KEY).update(value).digest("base64url");
}

export function createMetaCookie(data: AppMeta) {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = sign(payload);
  return `${payload}.${signature}`;
}
