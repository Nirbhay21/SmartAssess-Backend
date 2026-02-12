import { z } from "zod";

export const recruiterOnboardingSchema = z.object({
  // Step 1
  organizationName: z
    .string()
    .min(1, "Organization name is required")
    .min(2, "Organization name must be at least 2 characters"),
  organizationSize: z.string().min(1, "Organization size is required"),
  industry: z.string().min(1, "Industry is required"),
  country: z.string().min(1, "Country is required"),

  // Step 2
  hiringDomains: z.array(z.string()).min(1, "Select at least one domain"),
  experienceLevelsHiring: z.array(z.string()).min(1, "Select at least one level"),
  companyWebsite: z.url("Invalid website URL").optional().or(z.literal("")),

  // Step 3 - LLM Setup
  llmProvider: z.string().min(1, "Select LLM provider"),
  llmApiKey: z.string().min(10, "Valid API key required"),
  defaultModel: z.string().optional(),
});

export type RecruiterOnboardingData = z.infer<typeof recruiterOnboardingSchema>;

export const recruiterOnboardingDraftSchema = recruiterOnboardingSchema.partial();
export type RecruiterOnboardingDraftData = z.infer<typeof recruiterOnboardingDraftSchema>;
