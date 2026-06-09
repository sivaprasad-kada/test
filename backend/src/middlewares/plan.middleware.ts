import { Request, Response, NextFunction } from "express";
import { UserModel } from "../models/User.model.js";
import { UrlModel } from "../models/Url.model.js";
import { env } from "../config/env.js";

// Helper to fetch user and ensure they exist
async function getAuthenticatedUser(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const user = await UserModel.findById(userId);
  if (!user) {
    res.status(401).json({ error: "Unauthorized - User not found" });
    return null;
  }
  return user;
}

// Middleware to require PRO plan
export const requireProPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    if (user.plan !== "PRO") {
      res.status(403).json({
        error: "Feature restricted",
        message: "This feature is only available in the PRO plan.",
      });
      return;
    }

    next();
  } catch (error: any) {
    console.error("[Plan Middleware] Pro check error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Middleware to check if user has reached their link limit
export const checkLinkLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const limit = user.plan === "PRO" ? env.PRO_MAX_LINKS : env.FREE_MAX_LINKS;
    const currentLinkCount = await UrlModel.countDocuments({ userId: user._id });

    if (currentLinkCount >= limit) {
      res.status(403).json({
        error: "Quota exceeded",
        message: `You have reached the limit of ${limit} links for your ${user.plan} plan. Please upgrade to a higher plan or delete existing links.`,
      });
      return;
    }

    next();
  } catch (error: any) {
    console.error("[Plan Middleware] Link limit check error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Middleware to check if user has reached their redirect limit
export const checkRedirectLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) return;

    const limit = user.plan === "PRO" ? env.PRO_MAX_REDIRECTS : env.FREE_MAX_REDIRECTS;
    const now = new Date();

    // Check for monthly quota reset
    if (!user.redirectQuotaResetDate || now >= user.redirectQuotaResetDate) {
      user.monthlyRedirectCount = 0;
      user.redirectQuotaResetDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      await user.save();
    }

    if (user.monthlyRedirectCount >= limit) {
      res.status(403).json({
        error: "Quota exceeded",
        message: `Your monthly redirect limit of ${limit} redirects has been exceeded.`,
      });
      return;
    }

    next();
  } catch (error: any) {
    console.error("[Plan Middleware] Redirect limit check error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
