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
export async function getCachedUrl(shortId: string): Promise<any | null> {
    const cached = await safeRedisOp(
        () => getRedisClient().get(urlKey(shortId)),
        null,
        "Cache"
    );
    if (!cached) return null;
    try {
        return JSON.parse(cached);
    } catch {
        // Fallback for backward compatibility if old cache entry was just a raw string
        return { longUrl: cached };
    }
}

/**
 * Cache a URL mapping with TTL.
 * Called after a MongoDB lookup on cache miss.
 * Silently fails if Redis is unavailable.
 */
export async function setCachedUrl(shortId: string, value: any): Promise<void> {
    const stringified = typeof value === "string" ? JSON.stringify({ longUrl: value }) : JSON.stringify(value);
    await safeRedisOp(
        async () => { await getRedisClient().set(urlKey(shortId), stringified, { EX: CACHE_TTL }); },
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
