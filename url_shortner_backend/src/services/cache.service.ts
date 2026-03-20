// this page is analyzed
import { getRedisClient } from "../config/redis.js";

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
 * TTL: 24 hours (86400 seconds) — configurable via CACHE_TTL env var.
 */

const CACHE_TTL = parseInt(process.env.CACHE_TTL || "86400", 10);

// ─── Key builders ────────────────────────────────────

function urlKey(shortId: string): string {
    return `url:${shortId}`;
}

// ─── Cache Operations ────────────────────────────────

/**
 * Get a cached long URL by shortId.
 * Returns null on cache miss.
 */
export async function getCachedUrl(shortId: string): Promise<string | null> {
    const redis = getRedisClient();
    return redis.get(urlKey(shortId));
}

/**
 * Cache a URL mapping with TTL.
 * Called after a MongoDB lookup on cache miss.
 */
export async function setCachedUrl(shortId: string, longUrl: string): Promise<void> {
    const redis = getRedisClient();
    await redis.set(urlKey(shortId), longUrl, { EX: CACHE_TTL });
}

/**
 * Invalidate a cached URL.
 * MUST be called when a URL is updated or deleted in MongoDB.
 */
export async function invalidateCachedUrl(shortId: string): Promise<void> {
    const redis = getRedisClient();
    await redis.del(urlKey(shortId));
}
