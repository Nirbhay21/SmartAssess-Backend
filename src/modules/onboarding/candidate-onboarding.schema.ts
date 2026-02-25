import { z } from "zod";

export const candidateOnboardingSchema = z.object({
  // step 1 - basic info
  domain: z.string().min(1, "Domain / Industry is required"),
  primaryRole: z.string().min(1, "Primary role is required"),
  highestEducation: z.string().min(1, "Highest education level is required"),
  currentStatus: z.string().min(1, "Current status is required"),

  // step 2 - skills & experience
  topSkills: z
    .array(z.string().min(1, "Skill is required").max(50, "Skill must be at most 50 characters"))
    .min(1, "At least one skill is required"),
  yearsOfExperience: z.enum(
    ["fresher", "0-1", "1-2", "2-3", "3-5", "5-7", "7-10", "10+"],
    "Select years of experience"
  ),
  professionalBio: z.string().min(20, "Professional bio must be at least 20 characters"),

  // step 3 - location & presence
  countryCode: z.string().min(1, "Country code is required"),
  portfolioUrl: z.url("Invalid portfolio URL").optional().or(z.literal("")),
  githubUrl: z.url("Invalid GitHub URL").optional().or(z.literal("")),
  linkedinUrl: z.url("Invalid LinkedIn profile URL").optional().or(z.literal("")),
});

export type CandidateOnboardingData = z.infer<typeof candidateOnboardingSchema>;

export const candidateOnboardingDraftSchema = candidateOnboardingSchema.partial();
export type CandidateOnboardingDraftData = z.infer<typeof candidateOnboardingDraftSchema>;

// Mapping from the `yearsOfExperience` enum value to numeric min/max years.
export const YEARS_OF_EXPERIENCE_RANGES = {
  fresher: { min: 0, max: 0 },
  "0-1": { min: 0, max: 1 },
  "1-2": { min: 1, max: 2 },
  "2-3": { min: 2, max: 3 },
  "3-5": { min: 3, max: 5 },
  "5-7": { min: 5, max: 7 },
  "7-10": { min: 7, max: 10 },
  "10+": { min: 10, max: null },
} as const;

export type YearsOfExperienceEnum = keyof typeof YEARS_OF_EXPERIENCE_RANGES;

export function mapYearsEnumToRange(key: YearsOfExperienceEnum) {
  return YEARS_OF_EXPERIENCE_RANGES[key];
}
