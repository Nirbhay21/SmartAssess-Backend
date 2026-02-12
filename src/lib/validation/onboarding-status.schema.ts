import { z } from "zod";

import {
  candidateOnboardingDraftSchema,
  candidateOnboardingSchema,
} from "./candidate-onboarding.schema.ts";
import {
  recruiterOnboardingDraftSchema,
  recruiterOnboardingSchema,
} from "./recruiter-onboarding.schema.ts";

export const onboardingUpdateSchema = z
  .discriminatedUnion("onboardingType", [
    z.object({
      onboardingType: z.literal("candidate"),
      currentStep: z
        .number()
        .int()
        .min(1, "Current step must be at least 1")
        .max(3, "Current step cannot be greater than 3"),
      isCompleted: z.boolean(),
      draft: candidateOnboardingDraftSchema,
    }),
    z.object({
      onboardingType: z.literal("recruiter"),
      currentStep: z
        .number()
        .int()
        .min(1, "Current step must be at least 1")
        .max(3, "Current step cannot be greater than 3"),
      isCompleted: z.boolean(),
      draft: recruiterOnboardingDraftSchema,
    }),
  ])
  .superRefine((data, ctx) => {
    // If onboarding is marked as completed, ensure that the draft data is complete and valid
    if (data.isCompleted) {
      if (data.onboardingType === "candidate") {
        const fullData = candidateOnboardingSchema.safeParse(data.draft);
        if (!fullData.success) {
          ctx.addIssue({
            code: "custom",
            message: "Candidate onboarding is incomplete",
            path: ["draft"],
          });
        }
      }

      if (data.onboardingType === "recruiter") {
        const fullData = recruiterOnboardingSchema.safeParse(data.draft);
        if (!fullData.success) {
          ctx.addIssue({
            code: "custom",
            message: "Recruiter onboarding is incomplete",
            path: ["draft"],
          });
        }
      }
    }
  });
