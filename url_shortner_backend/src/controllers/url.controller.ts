import { Request, Response } from "express";
import { createShortUrl, updateUrl, deleteUrl, getUserUrls, getAnalytics } from "../services/url.service.js";

/**
 * URL Shortening Controller
 * ─────────────────────────
 * Handles CRUD operations for URL management.
 */

// POST /api/url — Create a new short URL
export async function createShortUrlHandler(req: Request, res: Response) {
    try {
        let { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: "URL is required" });
        }

        if (!/^https?:\/\//i.test(url)) {
            url = `https://${url}`;
        }

        const userId = req.user?.id;
        if (!userId) {
             return res.status(401).json({ error: "Unauthorized" });
        }

        const shortId = await createShortUrl(url, userId);
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

        const analytics = await getAnalytics(shortId, userId);
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

        if (!url) {
            return res.status(400).json({ error: "New URL is required" });
        }

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
