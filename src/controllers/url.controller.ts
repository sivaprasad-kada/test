import { Request, Response } from "express";
import { createShortUrl, updateUrl, deleteUrl } from "../services/url.service.js";

/**
 * URL Shortening Controller
 * ─────────────────────────
 * Handles CRUD operations for URL management.
 */

// POST /api/url — Create a new short URL
export async function createShortUrlHandler(req: Request, res: Response) {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: "URL is required" });
        }

        const shortId = await createShortUrl(url);
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

// PUT /api/url/:shortId — Update a URL's destination
export async function updateUrlHandler(req: Request, res: Response) {
    try {
        const shortId = req.params.shortId as string;
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: "New URL is required" });
        }

        const updated = await updateUrl(shortId, url);

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

        const deleted = await deleteUrl(shortId);

        if (!deleted) {
            return res.status(404).json({ error: "Short URL not found" });
        }

        return res.json({ message: "URL deleted successfully", shortId });
    } catch (error: any) {
        console.error("[URL Controller] Delete error:", error.message);
        return res.status(500).json({ error: "Failed to delete URL" });
    }
}
