import { Request, Response, NextFunction } from "express";
import { getRedisClient, safeRedisOp, isRedisReady } from "../config/redis.js";
import { SessionModel } from "../models/Session.model.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const sessionId = req.cookies?.sessionId;
    if (!sessionId) {
      return res.status(401).json({ error: "Unauthorized - No session ID found" });
    }

    const sessionKey = `session:${sessionId}`;

    // 1. Try Redis first (graceful — returns null if Redis is down)
    const cachedSessionStr = await safeRedisOp(
      () => getRedisClient().get(sessionKey),
      null,
      "Auth"
    );

    if (cachedSessionStr) {
      try {
        const cachedSession = JSON.parse(cachedSessionStr);
        req.user = { id: cachedSession.userId };
        return next();
      } catch {
        // Invalid JSON in Redis — fall through to MongoDB
      }
    }

    // 2. Fallback to MongoDB
    const session = await SessionModel.findOne({ sessionId });
    if (!session) {
      return res.status(401).json({ error: "Unauthorized - Invalid or expired session" });
    }

    // Check if session has expired in DB
    if (session.expiresAt && session.expiresAt.getTime() < Date.now()) {
      await SessionModel.deleteOne({ sessionId });
      return res.status(401).json({ error: "Unauthorized - Session expired" });
    }

    // 3. Repopulate Redis (silently fails if Redis is down)
    const ttlSeconds = Math.max(1, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));
    await safeRedisOp(
      async () => {
        await getRedisClient().set(sessionKey, JSON.stringify({
          userId: session.userId.toString(),
          expiresAt: session.expiresAt.toISOString(),
        }), { EX: ttlSeconds });
      },
      undefined,
      "Auth"
    );

    req.user = { id: session.userId.toString() };
    next();
  } catch (error) {
    console.error("[Auth Middleware] Error:", error);
    res.status(500).json({ error: "Internal Server Error in Auth Middleware" });
  }
};
