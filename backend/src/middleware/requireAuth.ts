import { Request, Response, NextFunction } from "express";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

// Base Clerk middleware — populates (req as any).auth = { userId, sessionId, ... }
// Rejects unauthenticated requests with 401 automatically.
export const clerkAuth = ClerkExpressRequireAuth({});

export interface AuthedRequest extends Request {
  auth?: { userId: string | null; sessionId?: string | null };
}

/** Get the verified Clerk user id — never trust body/params for identity. */
export function getAuthId(req: Request): string | null {
  const auth = (req as AuthedRequest).auth;
  return auth?.userId ?? null;
}

/**
 * Enforce that the caller can only act as themselves.
 * Pass the client-claimed id (from body/params); rejects with 403 on mismatch.
 */
export function enforceSelf(
  req: Request,
  res: Response,
  claimedId: unknown
): string | null {
  const authId = getAuthId(req);
  if (!authId) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }
  if (typeof claimedId !== "string" || claimedId !== authId) {
    res.status(403).json({ message: "Forbidden: cannot act as another user" });
    return null;
  }
  return authId;
}

export function requireAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Run Clerk auth first, then a friendly 401 if still unauthenticated
  (clerkAuth as any)(req, res, (err?: any) => {
    if (err) return next(err);
    if (!getAuthId(req)) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  });
}
