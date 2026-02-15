import { BetterAuthError } from "better-auth";
import { z } from "zod";

import { env } from "../../config/env.schema.ts";

type SignupMetadata = {
  role: string;
  termsAccepted: boolean;
};

type MutableUser = {
  role?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: Date;
  termsAcceptedVersion?: string;
} & Record<string, unknown>;

// Validate signup metadata and apply to user object
export const validateAndApplyUserMetadata = (
  user: MutableUser,
  parsed: { success: true; data: SignupMetadata } | { success: false; error: z.ZodError }
): MutableUser => {
  if (!parsed.success) {
    throw new BetterAuthError("Invalid signup data", {
      cause: z.flattenError(parsed.error).formErrors,
    });
  }

  const { role, termsAccepted } = parsed.data;

  if (!role) {
    throw new BetterAuthError("User role is required");
  }

  if (!termsAccepted) {
    throw new BetterAuthError("Terms must be accepted");
  }

  user.role = role;
  user.termsAccepted = termsAccepted;
  user.termsAcceptedAt = new Date();
  user.termsAcceptedVersion = env.CURRENT_TERMS_VERSION;

  return user;
};
