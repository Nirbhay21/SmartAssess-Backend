import { and, eq, inArray, or } from "drizzle-orm";

import { createUserContext } from "../../../db/create-user-context.ts";
import {
  recruiterProfileTable,
  recruiterProfileTagTable,
  tagTable,
} from "../../../db/schema/index.ts";
import { ApplicationError } from "../../../shared/errors/application-error.ts";
import type { RecruiterOrganizationUpdateData } from "../organization/recruiter-organization.schema.ts";
import type { RecruiterProfileResponse } from "./recruiter-profile.type.ts";

export class RecruiterProfileService {
  constructor(private readonly userId: string) {}

  private get userCtx() {
    return createUserContext(this.userId);
  }

  async getProfile(): Promise<RecruiterProfileResponse> {
    const profile = await this.userCtx.withRls((tx) => {
      return tx.query.recruiterProfileTable.findFirst({
        where: eq(recruiterProfileTable.userId, this.userId),
        with: {
          user: {
            with: {
              sessions: true,
            },
          },
          tags: {
            with: {
              tag: true,
            },
          },
        },
      });
    });

    if (!profile) {
      throw new ApplicationError("Recruiter profile not found", 404);
    }

    const hiringDomains = profile.tags
      .filter((pt) => pt.tag.type === "domain")
      .map((pt) => pt.tag.name);

    const experienceLevels = profile.tags
      .filter((pt) => pt.tag.type === "experience_level")
      .map((pt) => pt.tag.name);

    const userSessions = profile.user.sessions.map((s) => ({
      id: s.id,
      expiresAt: s.expiresAt,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    return {
      user: {
        id: profile.user.id,
        name: profile.user.name,
        email: profile.user.email,
        avatarUrl: profile.user.image || null,
        sessions: userSessions,
      },
      organizationName: profile.organizationName,
      organizationSize: profile.organizationSize,
      industry: profile.industry,
      countryCode: profile.countryCode,
      organizationWebsite: profile.organizationWebsite,
      llmProvider: profile.llmProvider,
      defaultModel: profile.defaultModel,
      hiringDomains,
      experienceLevels,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  /**
   * Update only the organization-related fields from a recruiter profile.
   * Accepts a partial payload so callers can patch one or more properties.
   */
  async updateOrganization(data: RecruiterOrganizationUpdateData) {
    // build an object containing only defined values
    type UpdatePayload = Partial<{
      organizationName: string;
      organizationSize: string;
      industry: string;
      countryCode: string;
      organizationWebsite: string | null;
      llmProvider: string;
      defaultModel: string | null;
    }>;

    const updates: UpdatePayload = {};
    if (data.organizationName !== undefined) updates.organizationName = data.organizationName;
    if (data.organizationSize !== undefined) updates.organizationSize = data.organizationSize;
    if (data.industry !== undefined) updates.industry = data.industry;
    if (data.countryCode !== undefined) updates.countryCode = data.countryCode;
    if (data.organizationWebsite !== undefined)
      updates.organizationWebsite = data.organizationWebsite;
    if (data.llmProvider !== undefined) updates.llmProvider = data.llmProvider;
    if (data.defaultModel !== undefined) updates.defaultModel = data.defaultModel;

    // update profile fields if present
    if (Object.keys(updates).length > 0) {
      await this.userCtx.withRls((tx) =>
        tx
          .update(recruiterProfileTable)
          .set(updates)
          .where(eq(recruiterProfileTable.userId, this.userId))
      );
    }

    // handle tag updates (domains + experience levels)
    if (data.hiringDomains || data.experienceLevels) {
      await this.userCtx.withRls(async (tx) => {
        // determine desired lists
        const domains = data.hiringDomains ?? [];
        const levels = data.experienceLevels ?? [];

        // first, clear any existing associations for these tag types
        const typesToRemove: string[] = [];
        if (domains.length) typesToRemove.push("domain");
        if (levels.length) typesToRemove.push("experience_level");

        if (typesToRemove.length) {
          const existingTags = await tx.query.tagTable.findMany({
            where: inArray(tagTable.type, typesToRemove),
          });
          const existingIds = existingTags.map((t) => t.id);
          if (existingIds.length) {
            await tx
              .delete(recruiterProfileTagTable)
              .where(
                and(
                  eq(recruiterProfileTagTable.recruiterUserId, this.userId),
                  inArray(recruiterProfileTagTable.tagId, existingIds)
                )
              );
          }
        }

        // upsert tag names themselves so new values are available
        if (domains.length || levels.length) {
          await tx
            .insert(tagTable)
            .values([
              ...domains.map((d) => ({ name: d, type: "domain" })),
              ...levels.map((l) => ({ name: l, type: "experience_level" })),
            ])
            .onConflictDoNothing();
        }

        // now build and insert the new association rows in a single lookup
        const toInsert: Array<{ recruiterUserId: string; tagId: number }> = [];
        if (domains.length || levels.length) {
          const rows = await tx.query.tagTable.findMany({
            where: or(
              and(eq(tagTable.type, "domain"), inArray(tagTable.name, domains)),
              and(eq(tagTable.type, "experience_level"), inArray(tagTable.name, levels))
            ),
          });
          toInsert.push(...rows.map((tag) => ({ recruiterUserId: this.userId, tagId: tag.id })));
        }
        if (toInsert.length) {
          await tx.insert(recruiterProfileTagTable).values(toInsert);
        }
      });
    }

    // fetch and return fresh organization information (including tags)
    const updated = await this.userCtx.withRls((tx) =>
      tx.query.recruiterProfileTable.findFirst({
        where: eq(recruiterProfileTable.userId, this.userId),
        with: {
          tags: {
            with: { tag: true },
          },
        },
      })
    );

    if (!updated) {
      throw new ApplicationError("Recruiter profile not found", 404);
    }

    const hiringDomains = updated.tags
      .filter((pt) => pt.tag.type === "domain")
      .map((pt) => pt.tag.name);

    const experienceLevels = updated.tags
      .filter((pt) => pt.tag.type === "experience_level")
      .map((pt) => pt.tag.name);

    return {
      organizationName: updated.organizationName,
      organizationSize: updated.organizationSize,
      industry: updated.industry,
      countryCode: updated.countryCode,
      // schema allows empty string/undefined; convert null to empty string
      organizationWebsite: updated.organizationWebsite ?? undefined,
      llmProvider: updated.llmProvider,
      // make undefined if null
      defaultModel: updated.defaultModel ?? undefined,
      hiringDomains,
      experienceLevels,
    };
  }
}
