import { Router } from "express";

import { getOnboardingStatus, putOnboardingStatus } from "../controllers/onboarding.controller.ts";
import { requireAuth } from "../middlewares/auth.middleware.ts";

const onboardingRouter = Router();

onboardingRouter.get("/onboarding", requireAuth, getOnboardingStatus);
onboardingRouter.put("/onboarding", requireAuth, putOnboardingStatus);

export default onboardingRouter;
