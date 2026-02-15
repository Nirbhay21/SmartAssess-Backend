import { type NextFunction, type Request, type Response } from "express";

import { USER_ROLES, type UserRole } from "../../shared/constants/user-role.ts";
import { getAuth } from "../../utils/get-auth.ts";
import { OnboardingService } from "./onboarding.service.ts";

const parseUserRole = (role: string): UserRole => {
  if (USER_ROLES.includes(role as UserRole)) {
    return role as UserRole;
  }
  throw new Error("Invalid user role");
};

export const getOnboardingStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getAuth(req).user;
    const userRole = parseUserRole(user.role);

    const service = new OnboardingService(user.id, userRole);
    const result = await service.getStatus();

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

export const patchOnboardingStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getAuth(req).user;
    const userRole = parseUserRole(user.role);

    const service = new OnboardingService(user.id, userRole);
    await service.initializeIfNotExists();

    const result = await service.updateStatus(req.body);

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

export const completeOnboarding = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getAuth(req).user;
    const userRole = parseUserRole(user.role);

    const service = new OnboardingService(user.id, userRole);
    await service.initializeIfNotExists();
    const result = await service.completeOnboarding(req.body.draft, req.body.currentStep);

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};
