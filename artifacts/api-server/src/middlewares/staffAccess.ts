import type { RequestHandler } from "express";
import { getAuth } from "@clerk/express";

export const requireSignedIn: RequestHandler = (req, res, next) => {
  const { userId } = getAuth(req);
  if (userId) return next();
  if (
    process.env.NODE_ENV === "development" &&
    req.get("X-Prototype-Staff-Access") === "demo"
  ) {
    return next();
  }
  return res.status(401).json({ error: "Sign in to open the prototype staff queue." });
};
