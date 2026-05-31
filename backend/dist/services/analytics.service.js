"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTodayDate = getTodayDate;
exports.recordAnalytics = recordAnalytics;
exports.getAnalyticsHash = getAnalyticsHash;
exports.getUniqueVisitors = getUniqueVisitors;
exports.getLiveClickCount = getLiveClickCount;
exports.deleteAnalyticsKeys = deleteAnalyticsKeys;
exports.scanAnalyticsKeys = scanAnalyticsKeys;
const redis_js_1 = require("../config/redis.js");
/**
 * Analytics Service
 * ─────────────────
 * Manages Redis-based analytics counters and HyperLogLog structures.
 *
 * Key design:
 *   analytics:{shortId}:{date}  → Redis HASH with aggregated counters
 *   unique:{shortId}:{date}     → Redis HyperLogLog for unique visitors
 *   clicks:{shortId}:{date}     → Simple click counter (fast INCR)
 *
 * Data flows INTO Redis from the analytics worker,
 * and OUT of Redis to MongoDB via the aggregation scheduler.
 */
// ─── Key builders ────────────────────────────────────
function analyticsKey(shortId, date) {
    return `analytics:${shortId}:${date}`;
}
function uniqueKey(shortId, date) {
    return `unique:${shortId}:${date}`;
}
function clicksKey(shortId, date) {
    return `clicks:${shortId}:${date}`;
}
// ─── Get today's date in YYYY-MM-DD format ───────────
function getTodayDate() {
    return new Date().toISOString().slice(0, 10);
}
/**
 * Record a click event into Redis counters.
 * Called by the analytics worker (NOT during the request).
 *
 * Uses HINCRBY for O(1) atomic increments:
 *   - totalClicks
 *   - country:{code}
 *   - browser:{name}
 *   - device:{type}
 *
 * Uses PFADD for probabilistic unique visitor counting.
 */
async function recordAnalytics(data) {
    if (!(0, redis_js_1.isRedisReady)()) {
        console.warn("[Analytics] Redis unavailable, skipping analytics recording");
        return;
    }
    const redis = (0, redis_js_1.getRedisClient)();
    const date = data.timestamp.slice(0, 10); // YYYY-MM-DD
    const aKey = analyticsKey(data.shortId, date);
    const uKey = uniqueKey(data.shortId, date);
    const cKey = clicksKey(data.shortId, date);
    // Use a pipeline for atomic batch execution (reduces round trips)
    const pipeline = redis.multi();
    // Increment total clicks in the analytics hash
    pipeline.hIncrBy(aKey, "totalClicks", 1);
    // Increment country counter
    if (data.country && data.country !== "unknown") {
        pipeline.hIncrBy(aKey, `country:${data.country}`, 1);
    }
    // Increment browser counter
    if (data.browser && data.browser !== "unknown") {
        pipeline.hIncrBy(aKey, `browser:${data.browser}`, 1);
    }
    // Increment device counter
    if (data.device && data.device !== "unknown") {
        pipeline.hIncrBy(aKey, `device:${data.device}`, 1);
    }
    // Track unique visitors via HyperLogLog
    pipeline.pfAdd(uKey, data.ip);
    // Simple click counter for quick reads
    pipeline.incr(cKey);
    // Set TTL on analytics keys (48 hours — gives aggregator time to sync)
    const TTL_48H = 172800;
    pipeline.expire(aKey, TTL_48H);
    pipeline.expire(uKey, TTL_48H);
    pipeline.expire(cKey, TTL_48H);
    await pipeline.exec();
}
/**
 * Retrieve all analytics hash data for a given key.
 * Used by the aggregation scheduler to read counters before syncing.
 */
async function getAnalyticsHash(shortId, date) {
    return (0, redis_js_1.safeRedisOp)(() => (0, redis_js_1.getRedisClient)().hGetAll(analyticsKey(shortId, date)), {}, "Analytics");
}
/**
 * Get unique visitor count via HyperLogLog.
 */
async function getUniqueVisitors(shortId, date) {
    return (0, redis_js_1.safeRedisOp)(() => (0, redis_js_1.getRedisClient)().pfCount(uniqueKey(shortId, date)), 0, "Analytics");
}
/**
 * Get live click count from the simple counter.
 * Used to show real-time clicks before aggregation syncs to MongoDB.
 */
async function getLiveClickCount(shortId, date) {
    const val = await (0, redis_js_1.safeRedisOp)(() => (0, redis_js_1.getRedisClient)().get(clicksKey(shortId, date)), null, "Analytics");
    return val ? parseInt(val, 10) : 0;
}
/**
 * Delete analytics keys after successful sync to MongoDB.
 */
async function deleteAnalyticsKeys(shortId, date) {
    if (!(0, redis_js_1.isRedisReady)())
        return;
    try {
        const redis = (0, redis_js_1.getRedisClient)();
        const aKey = analyticsKey(shortId, date);
        // DO NOT DELETE uKey (HyperLogLog)!
        // If we delete the uKey, we lose the uniqueness state for the day.
        // It will be cleaned up naturally by its 48-hour TTL.
        const cKey = clicksKey(shortId, date);
        await redis.del(aKey);
        await redis.del(cKey);
    }
    catch (err) {
        console.error("[Analytics] Failed to delete Redis keys:", err.message);
    }
}
/**
 * Scan for all analytics keys matching the pattern.
 * Used by the aggregation scheduler to discover which
 * shortIds have pending analytics data.
 *
 * Returns an array of keys like: analytics:abc123:2026-03-15
 */
async function scanAnalyticsKeys() {
    if (!(0, redis_js_1.isRedisReady)()) {
        console.warn("[Analytics] Redis unavailable, cannot scan keys");
        return [];
    }
    try {
        const redis = (0, redis_js_1.getRedisClient)();
        const keys = [];
        // Use SCAN to iterate without blocking Redis
        for await (const key of redis.scanIterator({ MATCH: "analytics:*", COUNT: 100 })) {
            keys.push(String(key));
        }
        return keys;
    }
    catch (err) {
        console.error("[Analytics] Failed to scan keys:", err.message);
        return [];
    }
}
//# sourceMappingURL=analytics.service.js.map