import { type NextFunction, type Request, type Response } from "express";

import { env } from "../../config/env.schema.ts";
import { parseUserRole } from "../../shared/constants/user-role.ts";
import { getAuth } from "../../utils/get-auth.ts";
import { createMetaCookie } from "../../utils/meta-cookie.ts";
import { OnboardingService } from "./onboarding.service.ts";

export const getOnboardingStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getAuth(req).user;
    const userRole = parseUserRole(user.role);

    const service = new OnboardingService(user.id, userRole);
    const result = await service.getStatus();

    // update signed meta cookie so frontend has latest role + onboarding flag
    const oc = result.status === "completed";
    const meta = createMetaCookie({ r: userRole, oc });
    res.cookie("app_meta", meta, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 30,
      path: "/",
    });

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

    const result = await service.completeOnboarding(
      req.body.onboardingData,
      req.body.currentStep,
      req.body.onboardingType
    );

    // set updated meta cookie (frontend can read onboarding complete immediately)
    const meta = createMetaCookie({ r: userRole, oc: result.isCompleted === true });
    res.cookie("app_meta", meta, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 30,
      path: "/",
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};
