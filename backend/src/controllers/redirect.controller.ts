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
 *
 * Graceful Degradation:
 *   - If Redis is down, getLongUrl falls back to MongoDB
 *   - If BullMQ is down, redirect still works (analytics is skipped)
 */

import { UserModel } from "../models/User.model.js";
import { env } from "../config/env.js";

export const redirectUrl = async (req: Request, res: Response): Promise<void> => {
    try {
        const shortId = req.params.shortId as string;

        if (!shortId) {
            res.status(400).json({ error: "Short ID is required" });
            return;
        }

        // ── Step 1: Resolve URL (cache-aside with MongoDB fallback) ──────
        const resolved = await getLongUrl(shortId);

        if (!resolved) {
            res.status(404).json({ error: "URL not found" });
            return;
        }

        const { longUrl, userId } = resolved;

        // ── Step 2: Check Plan Limits & Redirect Quota ────────────────────
        if (userId) {
            const owner = await UserModel.findById(userId);
            if (owner) {
                const limit = owner.plan === "PRO" ? env.PRO_MAX_REDIRECTS : env.FREE_MAX_REDIRECTS;
                const now = new Date();

                // Dynamic monthly quota reset check
                if (!owner.redirectQuotaResetDate || now >= owner.redirectQuotaResetDate) {
                    owner.monthlyRedirectCount = 0;
                    owner.redirectQuotaResetDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
                    await owner.save();
                }

                if (owner.monthlyRedirectCount >= limit) {
                    res.status(403).send(`
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Redirect Limit Exceeded | DUS</title>
                            <style>
                                body {
                                    font-family: system-ui, -apple-system, sans-serif;
                                    display: flex;
                                    justify-content: center;
                                    align-items: center;
                                    height: 100vh;
                                    margin: 0;
                                    background: #0f172a;
                                    color: #f8fafc;
                                }
                                .container {
                                    text-align: center;
                                    padding: 2.5rem;
                                    border-radius: 1rem;
                                    background: #1e293b;
                                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
                                    max-width: 450px;
                                    border: 1px solid #334155;
                                }
                                h1 {
                                    font-size: 1.75rem;
                                    margin-bottom: 1rem;
                                    color: #f43f5e;
                                }
                                p {
                                    color: #94a3b8;
                                    margin-bottom: 1.75rem;
                                    line-height: 1.6;
                                }
                                .btn {
                                    display: inline-block;
                                    background: #2563eb;
                                    color: #ffffff;
                                    text-decoration: none;
                                    padding: 0.75rem 1.5rem;
                                    border-radius: 0.375rem;
                                    font-weight: 600;
                                    transition: background 0.2s;
                                }
                                .btn:hover {
                                    background: #1d4ed8;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <h1>Link Quota Exceeded</h1>
                                <p>The owner of this link has exceeded their monthly redirect limit. If you are the owner, please log in and upgrade your plan to restore redirect traffic.</p>
                                <a href="${env.FRONTEND_URL}/dashboard" class="btn">Go to Dashboard</a>
                            </div>
                        </body>
                        </html>
                    `);
                    return;
                }

                // Increment monthly redirect count for user
                await UserModel.updateOne({ _id: owner._id }, { $inc: { monthlyRedirectCount: 1 } });
            }
        }

        // ── Step 3: Redirect FIRST — ultra-low latency ─────
        let redirectTarget = longUrl;
        if (!/^https?:\/\//i.test(redirectTarget)) {
            redirectTarget = `https://${redirectTarget}`;
        }
        res.redirect(302, redirectTarget);

        // ── Step 3: Enqueue analytics (fire-and-forget) ────
        // This runs AFTER the response is sent to the client.
        // Even if the queue is down, the redirect still works.
        try {
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
        } catch (analyticsErr: any) {
            // Analytics preparation failed — redirect already succeeded
            console.error("[Redirect] Analytics prep error:", analyticsErr.message);
        }
    } catch (error: any) {
        console.error("[Redirect] Error:", error.message);

        // Only send error if headers haven't been sent yet
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal server error" });
        }
    }
};
