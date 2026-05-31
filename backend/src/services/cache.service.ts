import { getRedisClient, safeRedisOp, isRedisReady } from "../config/redis.js";

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

function urlKey(shortId: string): string {
    return `url:${shortId}`;
}

// ─── Cache Operations ────────────────────────────────

/**
 * Get a cached long URL by shortId.
 * Returns null on cache miss OR if Redis is unavailable.
 */
export async function getCachedUrl(shortId: string): Promise<string | null> {
    return safeRedisOp(
        () => getRedisClient().get(urlKey(shortId)),
        null,
        "Cache"
    );
}

/**
 * Cache a URL mapping with TTL.
 * Called after a MongoDB lookup on cache miss.
 * Silently fails if Redis is unavailable.
 */
export async function setCachedUrl(shortId: string, longUrl: string): Promise<void> {
    await safeRedisOp(
        async () => { await getRedisClient().set(urlKey(shortId), longUrl, { EX: CACHE_TTL }); },
        undefined,
        "Cache"
    );
}

/**
 * Invalidate a cached URL.
 * MUST be called when a URL is updated or deleted in MongoDB.
 * Silently fails if Redis is unavailable.
 */
export async function invalidateCachedUrl(shortId: string): Promise<void> {
    await safeRedisOp(
        async () => { await getRedisClient().del(urlKey(shortId)); },
        undefined,
        "Cache"
    );
}
