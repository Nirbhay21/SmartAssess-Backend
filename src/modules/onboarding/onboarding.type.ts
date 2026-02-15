import type { UserRole } from "../../shared/constants/user-role.ts";
import type { CandidateOnboardingDraftData } from "./candidate-onboarding.schema.ts";
import type { RecruiterOnboardingDraftData } from "./recruiter-onboarding.schema.ts";

export type OnboardingStatusResponse =
  | {
      status: "not_started";
      onboardingType: UserRole;
      currentStep: null;
      draft: null;
    }
  | {
      status: "completed";
      onboardingType: UserRole;
      currentStep: null;
      draft: null;
    }
  | {
      status: "in_progress";
      onboardingType: "candidate";
      currentStep: number;
      draft: CandidateOnboardingDraftData | null;
    }
  | {
      status: "in_progress";
      onboardingType: "recruiter";
      currentStep: number;
      draft: RecruiterOnboardingDraftData | null;
    };

export type OnboardingInitializeResponse = {
  type: "initialized";
  currentStep: number;
  isCompleted: boolean;
};

export type OnboardingUpdateResponse = {
  type: "draft_saved";
  currentStep: number;
  isCompleted: false;
};

export type OnboardingCompleteResponse = {
  type: "completed";
  currentStep: number;
  isCompleted: true;
};
