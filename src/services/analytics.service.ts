import { getRedisClient } from "../config/redis.js";

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

function analyticsKey(shortId: string, date: string): string {
    return `analytics:${shortId}:${date}`;
}

function uniqueKey(shortId: string, date: string): string {
    return `unique:${shortId}:${date}`;
}

function clicksKey(shortId: string, date: string): string {
    return `clicks:${shortId}:${date}`;
}

// ─── Get today's date in YYYY-MM-DD format ───────────

export function getTodayDate(): string {
    return new Date().toISOString().slice(0, 10);
}

// ─── Increment Analytics Counters ────────────────────

export interface AnalyticsData {
    shortId: string;
    ip: string;
    country: string;
    city: string;
    browser: string;
    device: string;
    referrer: string;
    timestamp: string;
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
export async function recordAnalytics(data: AnalyticsData): Promise<void> {
    const redis = getRedisClient();
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
export async function getAnalyticsHash(
    shortId: string,
    date: string
): Promise<Record<string, string>> {
    const redis = getRedisClient();
    const aKey = analyticsKey(shortId, date);
    return redis.hGetAll(aKey);
}

/**
 * Get unique visitor count via HyperLogLog.
 */
export async function getUniqueVisitors(
    shortId: string,
    date: string
): Promise<number> {
    const redis = getRedisClient();
    const uKey = uniqueKey(shortId, date);
    return redis.pfCount(uKey);
}

/**
 * Delete analytics keys after successful sync to MongoDB.
 */
export async function deleteAnalyticsKeys(
    shortId: string,
    date: string
): Promise<void> {
    const redis = getRedisClient();
    const aKey = analyticsKey(shortId, date);
    const uKey = uniqueKey(shortId, date);
    const cKey = clicksKey(shortId, date);

    await redis.del(aKey);
    await redis.del(uKey);
    await redis.del(cKey);
}

/**
 * Scan for all analytics keys matching the pattern.
 * Used by the aggregation scheduler to discover which
 * shortIds have pending analytics data.
 *
 * Returns an array of keys like: analytics:abc123:2026-03-15
 */
export async function scanAnalyticsKeys(): Promise<string[]> {
    const redis = getRedisClient();
    const keys: string[] = [];

    // Use SCAN to iterate without blocking Redis
    for await (const key of redis.scanIterator({ MATCH: "analytics:*", COUNT: 100 })) {
        keys.push(String(key));
    }

    return keys;
}
