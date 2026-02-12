import type { auth } from "../lib/auth/auth.js";

export type AuthSession = typeof auth.$Infer.Session;
export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
