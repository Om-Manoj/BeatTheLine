import type { RequestHandler } from "express";
import { getAuth } from "@clerk/express";

export const requireSignedIn: RequestHandler = (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Sign in to open the prototype staff queue." });
  return next();
};
