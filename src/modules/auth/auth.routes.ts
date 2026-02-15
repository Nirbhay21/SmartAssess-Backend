import { Router } from "express";

import { requireAuth } from "../../shared/middlewares/auth.middleware.ts";
import { getMe } from "./auth.controller.ts";

const authRouter = Router();

authRouter.get("/me", requireAuth, getMe);

export default authRouter;
