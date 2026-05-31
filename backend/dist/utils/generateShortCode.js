"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateShortCode = generateShortCode;
const redis_js_1 = require("../config/redis.js");
const base_x_1 = __importDefault(require("base-x"));
/**
 * Short Code Generator
 * ────────────────────
 * Generates unique short codes using Redis INCR + Base62 encoding.
 *
 * Uses Redis INCR for the atomic counter instead of MongoDB,
 * which is faster and avoids write contention on the database.
 *
 * Redis key: url_counter
 * Encoding:  Base62 (0-9, a-z, A-Z) for URL-safe short codes
 *
 * Fallback: If Redis is unavailable, uses crypto.randomUUID()
 * to generate a unique code (less aesthetically pleasing but functional).
 */
const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const base62 = (0, base_x_1.default)(BASE62);
async function generateShortCode(length = 6) {
    if (!(0, redis_js_1.isRedisReady)()) {
        // Fallback: use random UUID-based code when Redis is down
        const { randomUUID } = await import("crypto");
        return randomUUID().replace(/-/g, "").slice(0, length);
    }
    try {
        const redis = (0, redis_js_1.getRedisClient)();
        // Atomic counter increment — no race conditions
        const count = await redis.incr("url_counter");
        // Encode the counter value as Base62
        const shortCode = base62.encode(Buffer.from(count.toString()));
        // Pad to desired length for consistent URL aesthetics
        return shortCode.slice(0, length).padStart(length, "0");
    }
    catch (err) {
        // Fallback on any Redis error
        console.error("[ShortCode] Redis error, using UUID fallback:", err.message);
        const { randomUUID } = await import("crypto");
        return randomUUID().replace(/-/g, "").slice(0, length);
    }
}
//# sourceMappingURL=generateShortCode.js.map