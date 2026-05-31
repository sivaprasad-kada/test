"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachedUrl = getCachedUrl;
exports.setCachedUrl = setCachedUrl;
exports.invalidateCachedUrl = invalidateCachedUrl;
const redis_js_1 = require("../config/redis.js");
/**
 * Cache Service
 * ─────────────
 * Implements Cache-Aside (Lazy Loading) pattern for URL lookups.
 *
 * Key design:
 *   url:{shortId}  →  longUrl string
 *
 * Strategy:
 *   1. Check Redis for cached URL
 *   2. Cache hit  → return immediately (fast path)
 *   3. Cache miss → caller fetches from MongoDB, then calls setUrl()
 *
 * Graceful Degradation:
 *   If Redis is down, all operations return null/void silently.
 *   The caller falls back to MongoDB automatically.
 *
 * TTL: 24 hours (86400 seconds) — configurable via CACHE_TTL env var.
 */
const CACHE_TTL = parseInt(process.env.CACHE_TTL || "86400", 10);
// ─── Key builders ────────────────────────────────────
function urlKey(shortId) {
    return `url:${shortId}`;
}
// ─── Cache Operations ────────────────────────────────
/**
 * Get a cached long URL by shortId.
 * Returns null on cache miss OR if Redis is unavailable.
 */
async function getCachedUrl(shortId) {
    return (0, redis_js_1.safeRedisOp)(() => (0, redis_js_1.getRedisClient)().get(urlKey(shortId)), null, "Cache");
}
/**
 * Cache a URL mapping with TTL.
 * Called after a MongoDB lookup on cache miss.
 * Silently fails if Redis is unavailable.
 */
async function setCachedUrl(shortId, longUrl) {
    await (0, redis_js_1.safeRedisOp)(async () => { await (0, redis_js_1.getRedisClient)().set(urlKey(shortId), longUrl, { EX: CACHE_TTL }); }, undefined, "Cache");
}
/**
 * Invalidate a cached URL.
 * MUST be called when a URL is updated or deleted in MongoDB.
 * Silently fails if Redis is unavailable.
 */
async function invalidateCachedUrl(shortId) {
    await (0, redis_js_1.safeRedisOp)(async () => { await (0, redis_js_1.getRedisClient)().del(urlKey(shortId)); }, undefined, "Cache");
}
//# sourceMappingURL=cache.service.js.map