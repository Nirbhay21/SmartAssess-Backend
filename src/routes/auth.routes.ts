import { Router } from "express";

import { getMe } from "../controllers/auth.controller.ts";
import { requireAuth } from "../middlewares/auth.middleware.ts";

const authRouter = Router();

authRouter.get("/me", requireAuth, getMe);

export default authRouter;
