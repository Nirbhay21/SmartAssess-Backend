import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: ".env.local" });

export const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  FRONTEND_URL: z.url(),
  DATABASE_URL: z.url(),
  DATABASE_APP_USER_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  ENCRYPTION_KEY: z.string().min(32, "Encryption key must be at least 32 characters"),
  CURRENT_TERMS_VERSION: z.string().default("1.0.0"),
});

export type Env = z.infer<typeof envSchema>;

export const parseEnv = (data: unknown) => {
  const parsed = envSchema.safeParse(data);

  if (!parsed.success) {
    const errorMsg = "❌ Invalid environment variables:";
    console.error(errorMsg, JSON.stringify(z.flattenError(parsed.error).fieldErrors, null, 2));
    throw new Error(errorMsg);
  }

  return parsed.data;
};

export const env = parseEnv(process.env);
