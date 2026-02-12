import CryptoJS from "crypto-js";
import { and, eq, inArray, or } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import { createUserContext } from "../db/create-user-context.ts";
import {
  candidateProfileTable,
  candidateProfileTagTable,
  recruiterProfileTable,
  recruiterProfileTagTable,
  tagTable,
  userOnboardingTable,
} from "../db/schema/index.ts";
import {
  candidateOnboardingSchema,
  mapYearsEnumToRange,
} from "../lib/validation/candidate-onboarding.schema.ts";
import { env } from "../lib/validation/env.schema.ts";
import { onboardingUpdateSchema } from "../lib/validation/onboarding-status.schema.ts";
import { recruiterOnboardingSchema } from "../lib/validation/recruiter-onboarding.schema.ts";
import { getAuth } from "../utils/get-auth.ts";

type OnboardingStatus = "not_started" | "in_progress" | "completed";

export const getOnboardingStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getAuth(req).user.id;
    const userCtx = createUserContext(userId);

    const onboardingData = await userCtx.withRls((tx) => {
      return tx.query.userOnboardingTable.findFirst({
        where: eq(userOnboardingTable.userId, userId),
      });
    });

    let response: {
      status: OnboardingStatus;
      currentStep?: number;
      draft?: unknown;
    };

    if (!onboardingData) {
      response = {
        status: "not_started",
      };
    } else if (!onboardingData.isCompleted) {
      response = {
        status: "in_progress",
        currentStep: onboardingData.currentStep,
        draft: onboardingData.draft,
      };
    } else {
      response = {
        status: "completed",
      };
    }

    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

export const putOnboardingStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getAuth(req).user;
    const userCtx = createUserContext(user.id);

    const onboardingData = await userCtx.withRls((tx) => {
      return tx.query.userOnboardingTable.findFirst({
        where: eq(userOnboardingTable.userId, user.id),
      });
    });

    // If no onboarding data exists for the user, create a new record with default values and return it
    if (!onboardingData) {
      const [onboarding] = await userCtx.withRls(async (tx) => {
        return tx
          .insert(userOnboardingTable)
          .values({
            userId: user.id,
            currentStep: 1,
            isCompleted: false,
            draft: null,
          })
          .returning({
            currentStep: userOnboardingTable.currentStep,
            isCompleted: userOnboardingTable.isCompleted,
            draft: userOnboardingTable.draft,
          });
      });
      return res.json(onboarding);
    }

    // Parse and validate the incoming data using the onboardingUpdateSchema, which checks the structure of the data and also ensures that if onboarding is marked as completed, the provided draft data is complete and valid according to the full onboarding schema for the user's role
    const parsedData = onboardingUpdateSchema.safeParse({
      ...req.body,
      onboardingType: user.role,
    });

    // If the provided data is invalid, return a 400 error with details about the validation issues
    if (!parsedData.success) {
      return res.status(400).json({
        error: "Invalid onboarding data",
        details: z.flattenError(parsedData.error).fieldErrors,
      });
    }

    const { isCompleted, currentStep, draft } = parsedData.data;

    // If onboarding is not marked as completed, allow updating the current step and draft data without validating completeness
    if (!isCompleted) {
      const [updatedOnboarding] = await userCtx.withRls(async (tx) => {
        return tx
          .update(userOnboardingTable)
          .set({
            currentStep,
            isCompleted,
            draft,
          })
          .where(eq(userOnboardingTable.userId, user.id))
          .returning({
            currentStep: userOnboardingTable.currentStep,
            isCompleted: userOnboardingTable.isCompleted,
            draft: userOnboardingTable.draft,
          });
      });
      return res.json(updatedOnboarding);
    }

    // If onboarding is marked as completed, validate that the provided draft data is complete and valid according to the full onboarding schema
    // Validate the draft data against the full onboarding schema based on the user's role
    if (user.role === "candidate") {
      const parsedCandidateData = candidateOnboardingSchema.safeParse(draft);

      if (!parsedCandidateData.success) {
        return res.status(400).json({
          error: "Invalid candidate onboarding data",
          details: z.flattenError(parsedCandidateData.error).fieldErrors,
        });
      }

      const data = parsedCandidateData.data;

      const { min: minYears, max: maxYears } = mapYearsEnumToRange(data.yearsOfExperience);

      await userCtx.withRls(async (tx) => {
        // Check if candidate profile already exists for the user
        const existingProfile = await tx.query.candidateProfileTable.findFirst({
          where: eq(candidateProfileTable.userId, user.id),
        });

        if (existingProfile) {
          throw new Error("Candidate profile already exists");
        }

        // Upsert candidate profile data
        await tx.insert(candidateProfileTable).values({
          userId: user.id,
          domain: data.domain,
          primaryRole: data.primaryRole,
          highestEducation: data.highestEducation,
          currentStatus: data.currentStatus,
          yearsOfExperienceMin: minYears,
          yearsOfExperienceMax: maxYears,
          professionalBio: data.professionalBio,
          country: data.country,
          portfolioUrl: data.portfolioUrl || null,
          githubUrl: data.githubUrl || null,
          linkedinUrl: data.linkedinUrl || null,
        });

        // Insert missing skills into tag table (if not exists)
        await tx
          .insert(tagTable)
          .values(
            data.topSkills.map((skill) => ({
              name: skill,
              type: "skill",
            }))
          )
          .onConflictDoNothing();

        // Fetch skill tag IDs for the provided skills
        const tagRows = await tx.query.tagTable.findMany({
          where: and(eq(tagTable.type, "skill"), inArray(tagTable.name, data.topSkills)),
        });

        // Insert new skill tags for the candidate profile
        if (tagRows.length > 0) {
          await tx.insert(candidateProfileTagTable).values(
            tagRows.map((tag) => ({
              candidateUserId: user.id,
              tagId: tag.id,
            }))
          );
        }

        // Mark onboarding as completed and clear the draft data
        await tx
          .update(userOnboardingTable)
          .set({
            isCompleted: true,
            currentStep,
            draft: null,
          })
          .where(eq(userOnboardingTable.userId, user.id));
      });

      return res.json({ success: true, message: "Candidate onboarding completed successfully" });
    }

    if (user.role === "recruiter") {
      const existingProfile = await userCtx.withRls((tx) => {
        return tx.query.recruiterProfileTable.findFirst({
          where: eq(recruiterProfileTable.userId, user.id),
        });
      });

      if (existingProfile) {
        throw new Error("Recruiter profile already exists");
      }

      const parsedRecruiterData = recruiterOnboardingSchema.safeParse(draft);

      if (!parsedRecruiterData.success) {
        return res.status(400).json({
          error: "Invalid recruiter onboarding data",
          details: z.flattenError(parsedRecruiterData.error).fieldErrors,
        });
      }

      const data = parsedRecruiterData.data;

      await userCtx.withRls(async (tx) => {
        // Upsert recruiter profile data
        await tx.insert(recruiterProfileTable).values({
          userId: user.id,
          organizationName: data.organizationName,
          organizationSize: data.organizationSize,
          industry: data.industry,
          country: data.country,
          companyWebsite: data.companyWebsite || null,
          llmProvider: data.llmProvider,
          llmApiKey: CryptoJS.AES.encrypt(data.llmApiKey, env.ENCRYPTION_KEY).toString(),
          defaultModel: data.defaultModel || null,
        });

        // Insert missing domain + experience_level tags into tag table (if not exists)
        await tx
          .insert(tagTable)
          .values([
            ...data.hiringDomains.map((domain) => ({ name: domain, type: "domain" })),
            ...data.experienceLevelsHiring.map((level) => ({
              name: level,
              type: "experience_level",
            })),
          ])
          .onConflictDoNothing();

        // Fetch tag IDs for the provided hiring domains and experience levels
        const tagRows = await tx.query.tagTable.findMany({
          where: or(
            and(eq(tagTable.type, "domain"), inArray(tagTable.name, data.hiringDomains)),
            and(
              eq(tagTable.type, "experience_level"),
              inArray(tagTable.name, data.experienceLevelsHiring)
            )
          ),
        });

        // Insert new tags for the recruiter profile
        if (tagRows.length > 0) {
          await tx.insert(recruiterProfileTagTable).values(
            tagRows.map((tag) => ({
              recruiterUserId: user.id,
              tagId: tag.id,
            }))
          );
        }

        // Mark onboarding as completed and clear the draft data
        await tx
          .update(userOnboardingTable)
          .set({
            isCompleted: true,
            currentStep,
            draft: null,
          })
          .where(eq(userOnboardingTable.userId, user.id));
      });

      return res.json({ success: true, message: "Recruiter onboarding completed successfully" });
    }

    throw new Error("Invalid user role");
  } catch (error) {
    return next(error);
  }
};
