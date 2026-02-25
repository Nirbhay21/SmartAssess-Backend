import { Router } from "express";

import { requireAuth } from "../../../shared/middlewares/auth.middleware.ts";
import { getRecruiterProfile } from "./recruiter-profile.controller.ts";

const recruiterProfileRouter = Router();

recruiterProfileRouter.get("/recruiter/profile", requireAuth, getRecruiterProfile);

export default recruiterProfileRouter;
