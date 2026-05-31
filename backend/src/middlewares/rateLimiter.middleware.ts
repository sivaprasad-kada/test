import rateLimit from "express-rate-limit";

/**
 * Rate Limiting Middleware
 * ────────────────────────
 * Uses express-rate-limit with in-memory store.
 * Appropriate for single EC2 instance deployment.
 *
 * Three tiers:
 *   1. Auth — strict (prevent brute-force)
 *   2. Redirect — moderate (the hot path)
 *   3. API — standard (dashboard/analytics)
 */

/**
 * Auth Rate Limiter
 * Protects login/register from brute-force attacks.
 * 20 requests per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: {
        error: "Too many authentication attempts. Please try again in 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Redirect Rate Limiter
 * Moderate limit on the hot redirect path.
 * 100 requests per minute per IP.
 */
export const redirectLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: {
        error: "Too many redirect requests. Please slow down.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * API Rate Limiter
 * Standard limit for dashboard and analytics endpoints.
 * 60 requests per minute per IP.
 */
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    message: {
        error: "Too many API requests. Please try again shortly.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
