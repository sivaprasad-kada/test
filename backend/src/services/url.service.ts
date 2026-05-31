import { UrlModel } from "../models/Url.model.js";
import { AnalyticsModel } from "../models/Analytics.model.js";
import { getCachedUrl, setCachedUrl, invalidateCachedUrl } from "./cache.service.js";
import { generateShortCode } from "../utils/generateShortCode.js";
import { getLiveClickCount, getUniqueVisitors, getTodayDate } from "./analytics.service.js";

/**
 * URL Service
 * ───────────
 * Handles URL creation, lookup, update, and deletion.
 * Integrates with the cache service for fast reads.
 */

// ─── Create ──────────────────────────────────────────

/**
 * Create a new short URL mapping.
 * Returns the generated short code.
 */
export async function createShortUrl(longUrl: string, userId: string): Promise<string> {
  const shortId = await generateShortCode();

  await UrlModel.create({
    shortId,
    longUrl,
    userId,
  });

  // Pre-warm cache so the first redirect is fast
  await setCachedUrl(shortId, longUrl);

  return shortId;
}

// ─── Read (with Cache-Aside) ─────────────────────────

/**
 * Resolve a shortId to its original URL.
 * Implements Cache-Aside:
 *   1. Check Redis
 *   2. If hit → return
 *   3. If miss → MongoDB → populate Redis → return
 *
 * NOTE: We intentionally do NOT increment clicks here.
 * Click counting happens asynchronously via the analytics worker.
 */
export async function getLongUrl(shortId: string): Promise<string | null> {
  // Step 1: Check cache (returns null if Redis is down — graceful fallback)
  const cached = await getCachedUrl(shortId);
  if (cached) {
    return cached;
  }

  // Step 2: Cache miss (or Redis down) — query MongoDB
  const urlDoc = await UrlModel.findOne({ shortId }).select("longUrl").lean();

  if (!urlDoc || !urlDoc.longUrl) {
    return null;
  }

  // Step 3: Populate cache for future requests (no-op if Redis is down)
  await setCachedUrl(shortId, urlDoc.longUrl);

  return urlDoc.longUrl;
}

// ─── Get User URLs ───────────────────────────────────

export async function getUserUrls(userId: string) {
  // Get URLs from MongoDB
  const urls = await UrlModel.find({ userId }).sort({ createdAt: -1 }).lean();

  // Enrich each URL with live Redis click count for today
  // This ensures dashboard shows accurate counts even between aggregation cycles
  const today = getTodayDate();

  const enrichedUrls = await Promise.all(
    urls.map(async (url) => {
      // Get live clicks from Redis for today (not yet synced to MongoDB)
      const liveClicks = await getLiveClickCount(url.shortId, today);
      return {
        ...url,
        // Total clicks = MongoDB stored clicks + live Redis clicks for today
        clicks: (url.clicks || 0) + liveClicks,
      };
    })
  );

  return enrichedUrls;
}

/**
 * Get analytics for a specific shortId.
 * Returns MongoDB aggregated data merged with live Redis data for today.
 */
export async function getAnalytics(shortId: string, userId: string) {
  // Get aggregated analytics from MongoDB
  const mongoAnalytics = await AnalyticsModel.find({ shortId, userId })
    .sort({ date: -1 })
    .lean();

  // Get live data from Redis for today
  const today = getTodayDate();
  const liveClicks = await getLiveClickCount(shortId, today);
  const liveUnique = await getUniqueVisitors(shortId, today);

  // If there are live clicks for today, merge them into the response
  if (liveClicks > 0 || liveUnique > 0) {
    const todayEntry = mongoAnalytics.find((a) => a.date === today);

    if (todayEntry) {
      // Merge live data on top of the aggregated data for today
      todayEntry.totalClicks = (todayEntry.totalClicks || 0) + liveClicks;
      todayEntry.uniqueVisitors = Math.max(todayEntry.uniqueVisitors || 0, liveUnique);
    } else {
      // No MongoDB entry for today yet — create a synthetic one from Redis
      mongoAnalytics.unshift({
        _id: `live-${today}` as any,
        shortId,
        date: today,
        totalClicks: liveClicks,
        uniqueVisitors: liveUnique,
        countries: {},
        browsers: {},
        devices: {},
      } as any);
    }
  }

  return mongoAnalytics;
}

// ─── Update ──────────────────────────────────────────

/**
 * Update the long URL for an existing short code.
 * Invalidates cache to prevent stale redirects.
 */
export async function updateUrl(shortId: string, newLongUrl: string, userId: string): Promise<boolean> {
  const result = await UrlModel.findOneAndUpdate(
    { shortId, userId },
    { longUrl: newLongUrl },
    { new: true }
  );

  if (!result) {
    return false;
  }

  // CRITICAL: Invalidate stale cache entry
  await invalidateCachedUrl(shortId);

  // Optionally pre-warm with new URL
  await setCachedUrl(shortId, newLongUrl);

  return true;
}

// ─── Delete ──────────────────────────────────────────

/**
 * Delete a URL mapping.
 * Invalidates cache so deleted URLs stop redirecting immediately.
 */
export async function deleteUrl(shortId: string, userId: string): Promise<boolean> {
  const result = await UrlModel.findOneAndDelete({ shortId, userId });

  if (!result) {
    return false;
  }

  // CRITICAL: Remove from cache
  await invalidateCachedUrl(shortId);

  return true;
}