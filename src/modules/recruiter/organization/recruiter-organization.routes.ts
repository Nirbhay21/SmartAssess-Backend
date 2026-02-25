import { Router } from "express";

import { requireAuth } from "../../../shared/middlewares/auth.middleware.ts";
import { patchRecruiterOrganization } from "./recruiter-organization.controller.ts";

const recruiterOrganizationRouter = Router();

// patch route for updating recruiter organization information
recruiterOrganizationRouter.patch(
  "/recruiter/organization",
  requireAuth,
  patchRecruiterOrganization
);

export default recruiterOrganizationRouter;
