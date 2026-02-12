import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";

import { auth } from "../lib/auth/auth.js";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authData = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!authData) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    req.auth = authData;
    return next();
  } catch (error) {
    console.error("Authentication error:", error);
    return next(error);
  }
};
