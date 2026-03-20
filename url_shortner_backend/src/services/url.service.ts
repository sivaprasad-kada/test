// this page is analyzed
import { UrlModel } from "../models/Url.model.js";
import { AnalyticsModel } from "../models/Analytics.model.js";
import { getCachedUrl, setCachedUrl, invalidateCachedUrl } from "./cache.service.js";
import { generateShortCode } from "../utils/generateShortCode.js";
import { getRedisClient } from "../config/redis.js";

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
  const redis = getRedisClient();
  const testCounter = await redis.get("url_counter")
  console.log(testCounter)
  const shortId = await generateShortCode();
  console.log(shortId)
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
  // Step 1: Check cache
  const cached = await getCachedUrl(shortId);
  if (cached) {
    return cached;
  }

  // Step 2: Cache miss — query MongoDB
  const urlDoc = await UrlModel.findOne({ shortId }).select("longUrl").lean();

  if (!urlDoc || !urlDoc.longUrl) {
    return null;
  }

  // Step 3: Populate cache for future requests
  await setCachedUrl(shortId, urlDoc.longUrl);

  return urlDoc.longUrl;
}

// ─── Get User URLs ───────────────────────────────────

export async function getUserUrls(userId: string) {
  return await UrlModel.find({ userId }).sort({ createdAt: -1 });
}

export async function getAnalytics(shortId: string, userId: string) {
  return await AnalyticsModel.find({ shortId, userId }).sort({ date: -1 });
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