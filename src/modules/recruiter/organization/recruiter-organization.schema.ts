import { z } from "zod";

// Schema for validating recruiter organization data (used when creating or updating)
export const recruiterOrganizationSchema = z.object({
  organizationName: z
    .string()
    .min(1, "Organization name is required")
    .min(2, "Organization name must be at least 2 characters"),
  organizationSize: z.string().min(1, "Organization size is required"),
  industry: z.string().min(1, "Industry is required"),
  countryCode: z.string().min(1, "Country code is required"),

  // hiring preferences stored as tags
  hiringDomains: z.array(z.string()).min(1, "Select at least one domain"),
  experienceLevels: z.array(z.string()).min(1, "Select at least one experience level"),

  organizationWebsite: z.url("Invalid website URL").optional().or(z.literal("")),
  llmProvider: z.string().min(1, "Select LLM provider"),
  defaultModel: z.string().optional(),
});

// Partial schema for patch operations
export const recruiterOrganizationPartialSchema = recruiterOrganizationSchema.partial();

// Types exported for use throughout the application
export type RecruiterOrganizationData = z.infer<typeof recruiterOrganizationSchema>;
export type RecruiterOrganizationUpdateData = z.infer<typeof recruiterOrganizationPartialSchema>;
