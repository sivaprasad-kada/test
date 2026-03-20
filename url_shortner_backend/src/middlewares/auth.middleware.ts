import { Request, Response, NextFunction } from "express";
import { getRedisClient } from "../config/redis.js";
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

    const redisClient = getRedisClient();
    const sessionKey = `session:${sessionId}`;
    
    // 1. Check Redis
    const cachedSessionStr = await redisClient.get(sessionKey);
    if (cachedSessionStr) {
      const cachedSession = JSON.parse(cachedSessionStr);
      req.user = { id: cachedSession.userId };
      return next();
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

    // 3. Repopulate Redis
    const ttlSeconds = Math.max(1, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));
    await redisClient.set(sessionKey, JSON.stringify({
      userId: session.userId.toString(),
      expiresAt: session.expiresAt.toISOString(),
    }), { EX: ttlSeconds });

    req.user = { id: session.userId.toString() };
    next();
  } catch (error) {
    console.error("[Auth Middleware] Error:", error);
    res.status(500).json({ error: "Internal Server Error in Auth Middleware" });
  }
};
