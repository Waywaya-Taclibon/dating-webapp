import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Trust Render's reverse proxy (1 hop) so rate-limit sees real client IPs.
export function applySecurityHeaders(app: import("express").Express) {
  app.set("trust proxy", 1);
  app.use(
    helmet({
      // Socket.IO polling + Clerk images need cross-origin resources
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
}

// General API throttle — generous, just stops runaway loops/bots.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many requests, slow down." },
});

// Strict throttle for write-heavy endpoints (swipe, send, reset).
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many actions, try again in a minute." },
});
