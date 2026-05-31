"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redirectUrl = void 0;
const url_service_js_1 = require("../services/url.service.js");
const analytics_queue_js_1 = require("../queues/analytics.queue.js");
const ip_util_js_1 = require("../utils/ip.util.js");
const useragent_util_js_1 = require("../utils/useragent.util.js");
const geo_util_js_1 = require("../utils/geo.util.js");
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
 *
 * Graceful Degradation:
 *   - If Redis is down, getLongUrl falls back to MongoDB
 *   - If BullMQ is down, redirect still works (analytics is skipped)
 */
const redirectUrl = async (req, res) => {
    try {
        const shortId = req.params.shortId;
        if (!shortId) {
            res.status(400).json({ error: "Short ID is required" });
            return;
        }
        // ── Step 1: Resolve URL (cache-aside with MongoDB fallback) ──────
        const longUrl = await (0, url_service_js_1.getLongUrl)(shortId);
        if (!longUrl) {
            res.status(404).json({ error: "URL not found" });
            return;
        }
        // ── Step 2: Redirect FIRST — ultra-low latency ─────
        let redirectTarget = longUrl;
        if (!/^https?:\/\//i.test(redirectTarget)) {
            redirectTarget = `https://${redirectTarget}`;
        }
        res.redirect(302, redirectTarget);
        // ── Step 3: Enqueue analytics (fire-and-forget) ────
        // This runs AFTER the response is sent to the client.
        // Even if the queue is down, the redirect still works.
        try {
            const ip = (0, ip_util_js_1.extractIp)(req);
            const uaHeader = req.headers["user-agent"];
            const uaString = Array.isArray(uaHeader) ? uaHeader[0] : uaHeader;
            const { browser, device } = (0, useragent_util_js_1.parseUserAgent)(uaString);
            const { country, city } = (0, geo_util_js_1.lookupGeo)(ip);
            (0, analytics_queue_js_1.enqueueAnalyticsJob)({
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
        }
        catch (analyticsErr) {
            // Analytics preparation failed — redirect already succeeded
            console.error("[Redirect] Analytics prep error:", analyticsErr.message);
        }
    }
    catch (error) {
        console.error("[Redirect] Error:", error.message);
        // Only send error if headers haven't been sent yet
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal server error" });
        }
    }
};
exports.redirectUrl = redirectUrl;
//# sourceMappingURL=redirect.controller.js.map