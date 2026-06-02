"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateShortCode = generateShortCode;
const redis_js_1 = require("../config/redis.js");
const shortCode_js_1 = require("../config/shortCode.js");
const base62_js_1 = require("./base62.js");
const crypto_1 = require("crypto");
/**
 * Short Code Generator
 * ────────────────────
 * Generates unique, non-sequential short codes for URLs using:
 * 1. Redis INCR (Atomic counter) as the source of truth to ensure zero collisions.
 * 2. Bitwise XOR with a secret key (SHORT_CODE_SECRET) to obfuscate sequence.
 * 3. Base62 Encoding to turn the obfuscated integer value into a short URL-safe string.
 *
 * Why Redis INCR is used:
 * - Redis INCR is an O(1) atomic operation. It guarantees unique, non-overlapping IDs
 *   under high concurrency without database lock contention or separate transactions.
 *
 * Why XOR Obfuscation is used:
 * - Prevents URL enumeration (so competitors cannot guess previous/next links or count active links).
 * - Obfuscates sequential IDs, giving them a professional, random appearance.
 *
 * Why Base62 Encoding is used:
 * - Turn large numeric IDs into short, readable strings using characters `0-9`, `a-z`, `A-Z`.
 * - It is URL-safe and compact.
 *
 * Fallback Strategy:
 * - If Redis is unavailable, it generates 6 random bytes (`crypto.randomBytes(6)`),
 *   converts them to a 48-bit unsigned integer, and encodes it into Base62.
 *   This ensures no UUID slicing and maintains URL safety, randomness, and collision resistance.
 */
async function generateShortCode() {
    if (!(0, redis_js_1.isRedisReady)()) {
        return generateFallbackCode();
    }
    try {
        const redis = (0, redis_js_1.getRedisClient)();
        // 1. Redis Atomic Counter increment
        const counter = await redis.incr("url_counter");
        // 2. Secret-Based Obfuscation using bitwise XOR, cast to unsigned 32-bit integer
        const obfuscatedId = (counter ^ shortCode_js_1.SHORT_CODE_SECRET) >>> 0;
        // 3. Base62 Encode
        return (0, base62_js_1.encodeBase62)(obfuscatedId);
    }
    catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error("[ShortCode] Redis error, using crypto fallback:", errMsg);
        return generateFallbackCode();
    }
}
/**
 * Generates a fallback code when Redis is unavailable.
 * Generates 6 cryptographically secure random bytes, converts them
 * to a 48-bit integer, and encodes it into Base62.
 */
function generateFallbackCode() {
    const bytes = (0, crypto_1.randomBytes)(6);
    let num = 0;
    for (let i = 0; i < bytes.length; i++) {
        num = num * 256 + bytes[i];
    }
    return (0, base62_js_1.encodeBase62)(num);
}
//# sourceMappingURL=generateShortCode.js.map