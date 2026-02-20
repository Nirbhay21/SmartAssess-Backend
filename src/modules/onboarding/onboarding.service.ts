import CryptoJS from "crypto-js";
import { and, eq, inArray, or } from "drizzle-orm";

import { env } from "../../config/env.schema.ts";
import { createUserContext, type TransactionType } from "../../db/create-user-context.ts";
import {
  candidateProfileTable,
  candidateProfileTagTable,
  recruiterProfileTable,
  recruiterProfileTagTable,
  tagTable,
  userOnboardingTable,
} from "../../db/schema/index.ts";
import type { UserRole } from "../../shared/constants/user-role.ts";
import { ApplicationError } from "../../shared/errors/application-error.ts";
import {
  type CandidateOnboardingData,
  type CandidateOnboardingDraftData,
  candidateOnboardingDraftSchema,
  candidateOnboardingSchema,
  mapYearsEnumToRange,
} from "./candidate-onboarding.schema.ts";
import type {
  OnboardingCompleteResponse,
  OnboardingInitializeResponse,
  OnboardingStatusResponse,
  OnboardingUpdateResponse,
} from "./onboarding.type.ts";
import {
  type OnboardingStatusUpdateData,
  onboardingStatusUpdateSchema,
} from "./onboarding-status-update.schema.ts";
import {
  type RecruiterOnboardingData,
  type RecruiterOnboardingDraftData,
  recruiterOnboardingDraftSchema,
  recruiterOnboardingSchema,
} from "./recruiter-onboarding.schema.ts";

export class OnboardingService {
  constructor(
    private userId: string,
    private role: UserRole
  ) {}

  private get userCtx() {
    return createUserContext(this.userId);
  }

  private parseDraft(
    role: UserRole,
    draft: unknown
  ): CandidateOnboardingDraftData | RecruiterOnboardingDraftData | null {
    if (!draft) return null;

    if (role === "candidate") {
      const parsed = candidateOnboardingDraftSchema.safeParse(draft);
      return parsed.success ? parsed.data : null;
    }

    if (role === "recruiter") {
      const parsed = recruiterOnboardingDraftSchema.safeParse(draft);
      return parsed.success ? parsed.data : null;
    }

    return null;
  }

  async getStatus(): Promise<OnboardingStatusResponse> {
    const onboardingData = await this.userCtx.withRls((tx) => {
      return tx.query.userOnboardingTable.findFirst({
        where: eq(userOnboardingTable.userId, this.userId),
      });
    });

    if (!onboardingData) {
      return {
        status: "not_started",
        onboardingType: this.role,
        currentStep: null,
        draft: null,
      };
    }

    if (!onboardingData.isCompleted) {
      switch (this.role) {
        case "candidate":
          return {
            status: "in_progress",
            onboardingType: "candidate",
            currentStep: onboardingData.currentStep,
            draft: this.parseDraft(this.role, onboardingData.draft),
          };

        case "recruiter":
          return {
            status: "in_progress",
            onboardingType: "recruiter",
            currentStep: onboardingData.currentStep,
            draft: this.parseDraft(this.role, onboardingData.draft),
          };

        default:
          break;
      }
    }

    return {
      status: "completed",
      onboardingType: this.role,
      currentStep: null,
      draft: null,
    };
  }

  async initializeIfNotExists(): Promise<OnboardingInitializeResponse | null> {
    const existing = await this.userCtx.withRls((tx) => {
      return tx.query.userOnboardingTable.findFirst({
        where: eq(userOnboardingTable.userId, this.userId),
      });
    });

    if (existing) {
      return null;
    }

    const [newRecord] = await this.userCtx.withRls((tx) => {
      return tx
        .insert(userOnboardingTable)
        .values({
          userId: this.userId,
          currentStep: 1,
          isCompleted: false,
          draft: null,
        })
        .returning({
          currentStep: userOnboardingTable.currentStep,
          isCompleted: userOnboardingTable.isCompleted,
        });
    });

    if (!newRecord) {
      throw new ApplicationError("Failed to initialize onboarding");
    }

    return {
      type: "initialized",
      currentStep: newRecord.currentStep,
      isCompleted: newRecord.isCompleted,
    };
  }

  private async attachCandidateTags(tx: TransactionType, skills: string[]): Promise<void> {
    if (skills.length === 0) return;

    // Insert missing skills into tag table (if not exists)
    await tx
      .insert(tagTable)
      .values(
        skills.map((skill) => ({
          name: skill,
          type: "skill",
        }))
      )
      .onConflictDoNothing();

    // Fetch skill tag IDs for the provided skills
    const tagRows = await tx.query.tagTable.findMany({
      where: and(eq(tagTable.type, "skill"), inArray(tagTable.name, skills)),
    });

    // Insert new skill tags for the candidate profile
    if (tagRows.length > 0) {
      await tx.insert(candidateProfileTagTable).values(
        tagRows.map((tag) => ({
          candidateUserId: this.userId,
          tagId: tag.id,
        }))
      );
    }
  }

  async completeCandidateOnboarding(
    data: CandidateOnboardingData,
    currentStep: number
  ): Promise<void> {
    const { min: minYears, max: maxYears } = mapYearsEnumToRange(data.yearsOfExperience);

    await this.userCtx.withRls(async (tx) => {
      const existing = await tx.query.candidateProfileTable.findFirst({
        where: eq(candidateProfileTable.userId, this.userId),
      });

      if (existing) {
        throw new ApplicationError("Candidate profile already exists");
      }

      // Upsert candidate profile data
      await tx.insert(candidateProfileTable).values({
        userId: this.userId,
        domain: data.domain,
        primaryRole: data.primaryRole,
        highestEducation: data.highestEducation,
        currentStatus: data.currentStatus,
        yearsOfExperienceMin: minYears,
        yearsOfExperienceMax: maxYears,
        professionalBio: data.professionalBio,
        country: data.country,
        portfolioUrl: data.portfolioUrl ?? null,
        githubUrl: data.githubUrl ?? null,
        linkedinUrl: data.linkedinUrl ?? null,
      });

      // Attach skill tags to candidate profile
      await this.attachCandidateTags(tx, data.topSkills);

      // Mark onboarding as completed and clear the draft data
      await tx
        .update(userOnboardingTable)
        .set({
          isCompleted: true,
          currentStep: currentStep,
          draft: null,
        })
        .where(eq(userOnboardingTable.userId, this.userId));
    });
  }

  private async attachRecruiterTags(
    tx: TransactionType,
    domains: string[],
    experienceLevels: string[]
  ): Promise<void> {
    if (domains.length === 0 && experienceLevels.length === 0) return;

    // Insert missing domain + experience_level tags into tag table (if not exists)
    await tx
      .insert(tagTable)
      .values([
        ...domains.map((domain) => ({ name: domain, type: "domain" })),
        ...experienceLevels.map((level) => ({
          name: level,
          type: "experience_level",
        })),
      ])
      .onConflictDoNothing();

    // Fetch tag IDs for the provided hiring domains and experience levels
    const tagRows = await tx.query.tagTable.findMany({
      where: or(
        and(eq(tagTable.type, "domain"), inArray(tagTable.name, domains)),
        and(eq(tagTable.type, "experience_level"), inArray(tagTable.name, experienceLevels))
      ),
    });

    // Insert new tags for the recruiter profile
    if (tagRows.length > 0) {
      await tx.insert(recruiterProfileTagTable).values(
        tagRows.map((tag) => ({
          recruiterUserId: this.userId,
          tagId: tag.id,
        }))
      );
    }
  }

  async completeRecruiterOnboarding(
    data: RecruiterOnboardingData,
    currentStep: number
  ): Promise<void> {
    await this.userCtx.withRls(async (tx) => {
      const existing = await tx.query.recruiterProfileTable.findFirst({
        where: eq(recruiterProfileTable.userId, this.userId),
      });

      if (existing) {
        throw new ApplicationError("Recruiter profile already exists");
      }

      await tx.insert(recruiterProfileTable).values({
        userId: this.userId,
        organizationName: data.organizationName,
        organizationSize: data.organizationSize,
        industry: data.industry,
        country: data.country,
        companyWebsite: data.companyWebsite ?? null,
        llmProvider: data.llmProvider,
        llmApiKey: CryptoJS.AES.encrypt(data.llmApiKey, env.ENCRYPTION_KEY).toString(),
        defaultModel: data.defaultModel ?? null,
      });

      // Attach domain + experience_level tags to recruiter profile
      await this.attachRecruiterTags(tx, data.hiringDomains, data.experienceLevelsHiring);

      // Mark onboarding as completed and clear the draft data
      await tx
        .update(userOnboardingTable)
        .set({
          isCompleted: true,
          currentStep,
          draft: null,
        })
        .where(eq(userOnboardingTable.userId, this.userId));
    });
  }

  async updateStatus(body: OnboardingStatusUpdateData): Promise<OnboardingUpdateResponse> {
    if (body.onboardingType !== this.role) {
      throw new ApplicationError("Onboarding type does not match user role");
    }

    const parsed = onboardingStatusUpdateSchema.parse({
      ...body,
      onboardingType: this.role,
    });

    const { currentStep, isCompleted, draft } = parsed;

    await this.userCtx.withRls((tx) => {
      return tx
        .update(userOnboardingTable)
        .set({
          currentStep,
          draft,
          isCompleted,
        })
        .where(eq(userOnboardingTable.userId, this.userId));
    });

    return {
      type: "draft_saved",
      currentStep,
      isCompleted: false,
    };
  }

  async completeOnboarding(
    onboardingData: unknown,
    currentStep: number,
    onboardingType: UserRole = this.role
  ): Promise<OnboardingCompleteResponse> {
    if (currentStep < 1 || currentStep > 3) {
      throw new ApplicationError("Invalid current step");
    }

    if (onboardingType !== this.role) {
      throw new ApplicationError("Onboarding type does not match user role");
    }

    switch (this.role) {
      case "candidate": {
        const parsedDraft = candidateOnboardingSchema.parse(onboardingData);
        await this.completeCandidateOnboarding(parsedDraft, currentStep);
        break;
      }
      case "recruiter": {
        const parsedDraft = recruiterOnboardingSchema.parse(onboardingData);
        await this.completeRecruiterOnboarding(parsedDraft, currentStep);
        break;
      }
      default:
        throw new ApplicationError("Invalid user role for onboarding");
    }

    return {
      type: "completed",
      currentStep,
      isCompleted: true,
    };
  }
}
