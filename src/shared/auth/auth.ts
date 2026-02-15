import { betterAuth, BetterAuthError } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getOAuthState } from "better-auth/api";

import { env } from "../../config/env.schema.ts";
import { db } from "../../db/index.js";
import { accountTable, sessionTable, userTable, verificationTable } from "../../db/schema/index.js";
import { EmailSignupSchema } from "../../modules/auth/email-signup.schema.ts";
import { OauthSignupSchema } from "../../modules/auth/oauth-state.schema.ts";
import { validateAndApplyUserMetadata } from "./applySignupMetadata.ts";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: userTable,
      session: sessionTable,
      account: accountTable,
      verification: verificationTable,
    },
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        input: true,
      },
      termsAccepted: {
        type: "boolean",
        required: true,
        input: true,
        returned: false,
      },
      termsAcceptedAt: {
        type: "date",
        required: false,
        input: false,
        returned: false,
      },
      termsAcceptedVersion: {
        type: "string",
        required: false,
        input: false,
        returned: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.FRONTEND_URL],
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          if (ctx?.path.startsWith("/callback/")) {
            const rowState = await getOAuthState();
            const parseOAuthSignup = OauthSignupSchema.safeParse(rowState);
            validateAndApplyUserMetadata(user, parseOAuthSignup);
            return {
              data: user,
            };
          } else if (ctx?.path === "/sign-up/email") {
            const parsedEmailSignup = EmailSignupSchema.safeParse(ctx.body);
            validateAndApplyUserMetadata(user, parsedEmailSignup);
            return {
              data: user,
            };
          }

          throw new BetterAuthError("Unsupported signup flow (path)", {
            cause: ctx?.path,
          });
        },
      },
    },
  },
});
