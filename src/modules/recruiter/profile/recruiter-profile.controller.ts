import { type NextFunction, type Request, type Response } from "express";

import { ApplicationError } from "../../../shared/errors/application-error.ts";
import { getAuth } from "../../../utils/get-auth.ts";
import { RecruiterProfileService } from "./recruiter-profile.service.ts";

export const getRecruiterProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = getAuth(req).user;

    if (user.role !== "recruiter") {
      throw new ApplicationError("Forbidden: recruiter role required", 403);
    }

    const service = new RecruiterProfileService(user.id);
    const profile = await service.getProfile();

    res.json(profile);
  } catch (error) {
    next(error);
  }
};
