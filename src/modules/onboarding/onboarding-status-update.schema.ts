import { z } from "zod";

import { candidateOnboardingDraftSchema } from "./candidate-onboarding.schema.ts";
import { recruiterOnboardingDraftSchema } from "./recruiter-onboarding.schema.ts";

export const onboardingStatusUpdateSchema = z.discriminatedUnion("onboardingType", [
  z.object({
    onboardingType: z.literal("candidate"),
    currentStep: z
      .number()
      .int()
      .min(1, "Current step must be at least 1")
      .max(3, "Current step cannot be greater than 3"),
    // PATCH must not mark onboarding completed — completion goes through POST /onboarding/complete
    isCompleted: z.literal(false),
    draft: candidateOnboardingDraftSchema,
  }),
  z.object({
    onboardingType: z.literal("recruiter"),
    currentStep: z
      .number()
      .int()
      .min(1, "Current step must be at least 1")
      .max(3, "Current step cannot be greater than 3"),
    // PATCH must not mark onboarding completed — completion goes through POST /onboarding/complete
    isCompleted: z.literal(false),
    draft: recruiterOnboardingDraftSchema,
  }),
]);

export type OnboardingStatusUpdateData = z.infer<typeof onboardingStatusUpdateSchema>;
