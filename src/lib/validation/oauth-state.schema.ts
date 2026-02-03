import { z } from "zod";

import { USER_ROLES } from "../constants/user-role.ts";

/*
 *  OAuth state passed via Better Auth `additionalData`
 *  ⚠️ UNTRUSTED input — must be validated before use
 */

export const OauthSignupSchema = z.object({
  role: z.enum(USER_ROLES, { error: "Invalid roleIntent in OAuth additionalData" }),
  termsAccepted: z.literal(true, "You must accept the terms and conditions"),
});
