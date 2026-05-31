"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiLimiter = exports.redirectLimiter = exports.authLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
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
exports.authLimiter = (0, express_rate_limit_1.default)({
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
exports.redirectLimiter = (0, express_rate_limit_1.default)({
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
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    message: {
        error: "Too many API requests. Please try again shortly.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
//# sourceMappingURL=rateLimiter.middleware.js.map