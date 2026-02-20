import type { Request, Response } from "express";

import { env } from "../../config/env.schema.ts";
import { parseUserRole } from "../../shared/constants/user-role.ts";
import { getAuth } from "../../utils/get-auth.ts";
import { createMetaCookie } from "../../utils/meta-cookie.ts";
import { OnboardingService } from "../onboarding/onboarding.service.ts";

export const getMe = async (req: Request, res: Response) => {
  const { user } = getAuth(req);

  const userRole = parseUserRole(user.role);
  const onboardingService = new OnboardingService(user.id, userRole);
  const onboardingStatus = await onboardingService.getStatus();
  const oc = onboardingStatus.status === "completed";

  const meta = createMetaCookie({ r: userRole, oc });
  res.cookie("app_meta", meta, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  return res.status(200).json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    onboardingStatus: onboardingStatus.status,
  });
};
