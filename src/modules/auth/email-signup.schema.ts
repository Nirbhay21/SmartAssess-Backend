import { z } from "zod";

import { USER_ROLES } from "../../shared/constants/user-role.ts";

export const EmailSignupSchema = z
  .object({
    name: z
      .string()
      .min(1, "Full name is required")
      .min(2, "Full name must be at least 2 characters long")
      .max(100, "Full name must be at most 100 characters long")
      .trim(),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Email is required")
      .pipe(z.email("Invalid email address")),

    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters long")
      .max(100, "Password must be at most 100 characters long"),

    confirmPassword: z.string().min(1, "Please confirm your password"),

    role: z.enum(USER_ROLES, "Invalid account type"),

    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type EmailSignupFormData = z.infer<typeof EmailSignupSchema>;
