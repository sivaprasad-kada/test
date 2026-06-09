import { Request, Response } from "express";
import { createShortUrl, updateUrl, deleteUrl, getUserUrls, getAnalytics } from "../services/url.service.js";

/**
 * URL Shortening Controller
 * ─────────────────────────
 * Handles CRUD operations for URL management.
 */

import { UserModel } from "../models/User.model.js";
import { UrlModel } from "../models/Url.model.js";

const RESERVED_ALIASES = new Set([
    "login",
    "signup",
    "admin",
    "dashboard",
    "api",
    "billing",
    "pricing",
    "health",
]);

// POST /api/url — Create a new short URL
export async function createShortUrlHandler(req: Request, res: Response): Promise<any> {
    try {
        let { url, customAlias } = req.body;
        // Zod validation ensures url and customAlias format/rules are met if provided

        if (!/^https?:\/\//i.test(url)) {
            url = `https://${url}`;
        }

        const userId = req.user?.id;
        if (!userId) {
             return res.status(401).json({ error: "Unauthorized" });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(401).json({ error: "Unauthorized - User not found" });
        }

        let aliasToUse: string | undefined = undefined;

        if (customAlias && customAlias.trim() !== "") {
            // Check plan
            if (user.plan !== "PRO") {
                return res.status(403).json({
                    error: "Feature restricted",
                    message: "Custom aliases are only available in the PRO plan.",
                });
            }

            const sanitizedAlias = customAlias.trim().toLowerCase();

            // Validate alias format
            if (!/^[a-zA-Z0-9_-]{3,30}$/.test(sanitizedAlias)) {
                return res.status(400).json({
                    error: "Validation failed",
                    message: "Alias must be 3-30 characters and contain only letters, numbers, hyphens or underscores.",
                });
            }

            // Check reserved keywords
            if (RESERVED_ALIASES.has(sanitizedAlias)) {
                return res.status(400).json({
                    error: "Validation failed",
                    message: "This alias is reserved and cannot be used.",
                });
            }

            // Check availability in DB
            const existing = await UrlModel.findOne({ shortId: sanitizedAlias }).select("_id").lean();
            if (existing) {
                return res.status(400).json({
                    error: "Validation failed",
                    message: "Alias is already taken.",
                });
            }

            aliasToUse = sanitizedAlias;
        }

        const shortId = await createShortUrl(url, userId, aliasToUse);
        const baseUrl = `${req.protocol}://${req.get("host")}`;

        return res.status(201).json({
            shortId,
            shortUrl: `${baseUrl}/${shortId}`,
            longUrl: url,
        });
    } catch (error: any) {
        console.error("[URL Controller] Create error:", error.message);
        return res.status(500).json({ error: error.message });
    }
}

// GET /api/url — Get all URLs for the current user
export async function getUserUrlsHandler(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
             return res.status(401).json({ error: "Unauthorized" });
        }

        const urls = await getUserUrls(userId);
        return res.json(urls);
    } catch (error: any) {
        console.error("[URL Controller] Get URLs error:", error.message);
        return res.status(500).json({ error: "Failed to fetch URLs" });
    }
}

// GET /api/url/:shortId/analytics — Get analytics for a specific URL
export async function getAnalyticsHandler(req: Request, res: Response) {
    try {
        const shortId = req.params.shortId as string;
        const userId = req.user?.id;
        
        if (!userId) {
             return res.status(401).json({ error: "Unauthorized" });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(401).json({ error: "Unauthorized - User not found" });
        }

        const analytics = await getAnalytics(shortId, userId);

        if (user.plan !== "PRO") {
            const strippedAnalytics = analytics.map((entry: any) => {
                const obj = typeof entry.toObject === "function" ? entry.toObject() : { ...entry };
                obj.countries = {};
                obj.browsers = {};
                obj.devices = {};
                return obj;
            });
            return res.json(strippedAnalytics);
        }

        return res.json(analytics);
    } catch (error: any) {
        console.error("[URL Controller] Get Analytics error:", error.message);
        return res.status(500).json({ error: "Failed to fetch analytics" });
    }
}

// PUT /api/url/:shortId — Update a URL's destination
export async function updateUrlHandler(req: Request, res: Response) {
    try {
        const shortId = req.params.shortId as string;
        let { url } = req.body;
        // Zod validation ensures url is present and valid

        if (!/^https?:\/\//i.test(url)) {
            url = `https://${url}`;
        }

        const userId = req.user?.id;
        if (!userId) {
             return res.status(401).json({ error: "Unauthorized" });
        }

        const updated = await updateUrl(shortId, url, userId);

        if (!updated) {
            return res.status(404).json({ error: "Short URL not found" });
        }

        return res.json({ message: "URL updated successfully", shortId });
    } catch (error: any) {
        console.error("[URL Controller] Update error:", error.message);
        return res.status(500).json({ error: "Failed to update URL" });
    }
}

// DELETE /api/url/:shortId — Delete a URL mapping
export async function deleteUrlHandler(req: Request, res: Response) {
    try {
        const shortId = req.params.shortId as string;

        const userId = req.user?.id;
        if (!userId) {
             return res.status(401).json({ error: "Unauthorized" });
        }

        const deleted = await deleteUrl(shortId, userId);

        if (!deleted) {
            return res.status(404).json({ error: "Short URL not found" });
        }

        return res.json({ message: "URL deleted successfully", shortId });
    } catch (error: any) {
        console.error("[URL Controller] Delete error:", error.message);
        return res.status(500).json({ error: "Failed to delete URL" });
    }
}
