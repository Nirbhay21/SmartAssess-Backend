import { Router } from "express";

import { requireAuth } from "../../shared/middlewares/auth.middleware.ts";
import {
  completeOnboarding,
  getOnboardingStatus,
  patchOnboardingStatus,
} from "./onboarding.controller.ts";

const onboardingRouter = Router();

onboardingRouter.get("/onboarding", requireAuth, getOnboardingStatus);
onboardingRouter.patch("/onboarding", requireAuth, patchOnboardingStatus);
onboardingRouter.post("/onboarding/complete", requireAuth, completeOnboarding);

export default onboardingRouter;
