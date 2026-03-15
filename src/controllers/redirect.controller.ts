import { Request, Response } from "express";
import { getLongUrl } from "../services/url.service.js";
import { enqueueAnalyticsJob } from "../queues/analytics.queue.js";
import { extractIp } from "../utils/ip.util.js";
import { parseUserAgent } from "../utils/useragent.util.js";
import { lookupGeo } from "../utils/geo.util.js";

/**
 * Redirect Controller
 * ───────────────────
 * Handles GET /:shortId — the hot path of the entire system.
 *
 * Optimized for minimal latency:
 *   1. Extract shortId from URL params
 *   2. Look up longUrl (Redis cache → MongoDB fallback)
 *   3. Redirect immediately (302)
 *   4. Push analytics job to BullMQ (fire-and-forget)
 *
 * CRITICAL: The analytics job is enqueued AFTER res.redirect()
 * so the user gets their response before any analytics work begins.
 * We use fire-and-forget (.catch) so a queue failure never blocks redirect.
 */

export const redirectUrl = async (req: Request, res: Response): Promise<void> => {
    try {
        const shortId = req.params.shortId as string;

        if (!shortId) {
            res.status(400).json({ error: "Short ID is required" });
            return;
        }

        // ── Step 1: Resolve URL (cache-aside pattern) ──────
        const longUrl = await getLongUrl(shortId);

        if (!longUrl) {
            res.status(404).json({ error: "URL not found" });
            return;
        }

        // ── Step 2: Redirect FIRST — ultra-low latency ─────
        res.redirect(302, longUrl);

        // ── Step 3: Enqueue analytics (fire-and-forget) ────
        // This runs AFTER the response is sent to the client.
        // Even if the queue is down, the redirect still works.
        const ip = extractIp(req);
        const uaHeader = req.headers["user-agent"];
        const uaString = Array.isArray(uaHeader) ? uaHeader[0] : uaHeader;
        const { browser, device } = parseUserAgent(uaString);
        const { country, city } = lookupGeo(ip);

        enqueueAnalyticsJob({
            shortId,
            ip,
            country,
            city,
            browser,
            device,
            referrer: String(req.headers.referer || req.headers.referrer || "direct"),
            timestamp: new Date().toISOString(),
        }).catch((err) => {
            // Log but never block — analytics is non-critical
            console.error("[Redirect] Failed to enqueue analytics job:", err.message);
        });
    } catch (error: any) {
        console.error("[Redirect] Error:", error.message);

        // Only send error if headers haven't been sent yet
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal server error" });
        }
    }
};
