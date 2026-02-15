import type { Request, Response } from "express";

import { getAuth } from "../../utils/get-auth.ts";

export const getMe = (req: Request, res: Response) => {
  const { user } = getAuth(req);

  return res.status(200).json({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });
};
