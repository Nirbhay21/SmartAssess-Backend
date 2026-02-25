import { type NextFunction, type Request, type Response } from "express";

import { ApplicationError } from "../../../shared/errors/application-error.ts";
import { getAuth } from "../../../utils/get-auth.ts";
import { RecruiterProfileService } from "../profile/recruiter-profile.service.ts";
import {
  type RecruiterOrganizationData,
  recruiterOrganizationPartialSchema,
} from "./recruiter-organization.schema.ts";

export const patchRecruiterOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = getAuth(req).user;

    if (user.role !== "recruiter") {
      throw new ApplicationError("Forbidden: recruiter role required", 403);
    }

    // validate incoming data (partial allowed for patch)
    const data = recruiterOrganizationPartialSchema.parse(req.body);

    const service = new RecruiterProfileService(user.id);
    const updated: RecruiterOrganizationData = await service.updateOrganization(data);

    res.json(updated);
  } catch (error) {
    next(error);
  }
};
