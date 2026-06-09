"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShortUrl = createShortUrl;
exports.getLongUrl = getLongUrl;
exports.getUserUrls = getUserUrls;
exports.getAnalytics = getAnalytics;
exports.updateUrl = updateUrl;
exports.deleteUrl = deleteUrl;
const Url_model_js_1 = require("../models/Url.model.js");
const Analytics_model_js_1 = require("../models/Analytics.model.js");
const cache_service_js_1 = require("./cache.service.js");
const generateShortCode_js_1 = require("../utils/generateShortCode.js");
const analytics_service_js_1 = require("./analytics.service.js");
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
async function createShortUrl(longUrl, userId, customAlias) {
    const shortId = customAlias ? customAlias.trim().toLowerCase() : await (0, generateShortCode_js_1.generateShortCode)();
    await Url_model_js_1.UrlModel.create({
        shortId,
        longUrl,
        userId,
    });
    // Pre-warm cache so the first redirect is fast
    await (0, cache_service_js_1.setCachedUrl)(shortId, longUrl);
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
async function getLongUrl(shortId) {
    // Step 1: Check cache (returns null if Redis is down — graceful fallback)
    const cached = await (0, cache_service_js_1.getCachedUrl)(shortId);
    if (cached && cached.longUrl) {
        return cached;
    }
    // Step 2: Cache miss (or Redis down) — query MongoDB
    const urlDoc = await Url_model_js_1.UrlModel.findOne({ shortId }).select("longUrl userId").lean();
    if (!urlDoc || !urlDoc.longUrl) {
        return null;
    }
    const result = {
        longUrl: urlDoc.longUrl,
        userId: urlDoc.userId ? urlDoc.userId.toString() : undefined,
    };
    // Step 3: Populate cache for future requests (no-op if Redis is down)
    await (0, cache_service_js_1.setCachedUrl)(shortId, result);
    return result;
}
// ─── Get User URLs ───────────────────────────────────
async function getUserUrls(userId) {
    // Get URLs from MongoDB
    const urls = await Url_model_js_1.UrlModel.find({ userId }).sort({ createdAt: -1 }).lean();
    // Enrich each URL with live Redis click count for today
    // This ensures dashboard shows accurate counts even between aggregation cycles
    const today = (0, analytics_service_js_1.getTodayDate)();
    const enrichedUrls = await Promise.all(urls.map(async (url) => {
        // Get live clicks from Redis for today (not yet synced to MongoDB)
        const liveClicks = await (0, analytics_service_js_1.getLiveClickCount)(url.shortId, today);
        return {
            ...url,
            // Total clicks = MongoDB stored clicks + live Redis clicks for today
            clicks: (url.clicks || 0) + liveClicks,
        };
    }));
    return enrichedUrls;
}
/**
 * Get analytics for a specific shortId.
 * Returns MongoDB aggregated data merged with live Redis data for today.
 */
async function getAnalytics(shortId, userId) {
    // Get aggregated analytics from MongoDB
    const mongoAnalytics = await Analytics_model_js_1.AnalyticsModel.find({ shortId, userId })
        .sort({ date: -1 })
        .lean();
    // Get live data from Redis for today
    const today = (0, analytics_service_js_1.getTodayDate)();
    const liveClicks = await (0, analytics_service_js_1.getLiveClickCount)(shortId, today);
    const liveUnique = await (0, analytics_service_js_1.getUniqueVisitors)(shortId, today);
    // If there are live clicks for today, merge them into the response
    if (liveClicks > 0 || liveUnique > 0) {
        const todayEntry = mongoAnalytics.find((a) => a.date === today);
        if (todayEntry) {
            // Merge live data on top of the aggregated data for today
            todayEntry.totalClicks = (todayEntry.totalClicks || 0) + liveClicks;
            todayEntry.uniqueVisitors = Math.max(todayEntry.uniqueVisitors || 0, liveUnique);
        }
        else {
            // No MongoDB entry for today yet — create a synthetic one from Redis
            mongoAnalytics.unshift({
                _id: `live-${today}`,
                shortId,
                date: today,
                totalClicks: liveClicks,
                uniqueVisitors: liveUnique,
                countries: {},
                browsers: {},
                devices: {},
            });
        }
    }
    return mongoAnalytics;
}
// ─── Update ──────────────────────────────────────────
/**
 * Update the long URL for an existing short code.
 * Invalidates cache to prevent stale redirects.
 */
async function updateUrl(shortId, newLongUrl, userId) {
    const result = await Url_model_js_1.UrlModel.findOneAndUpdate({ shortId, userId }, { longUrl: newLongUrl }, { new: true });
    if (!result) {
        return false;
    }
    // CRITICAL: Invalidate stale cache entry
    await (0, cache_service_js_1.invalidateCachedUrl)(shortId);
    // Optionally pre-warm with new URL
    await (0, cache_service_js_1.setCachedUrl)(shortId, newLongUrl);
    return true;
}
// ─── Delete ──────────────────────────────────────────
/**
 * Delete a URL mapping.
 * Invalidates cache so deleted URLs stop redirecting immediately.
 */
async function deleteUrl(shortId, userId) {
    const result = await Url_model_js_1.UrlModel.findOneAndDelete({ shortId, userId });
    if (!result) {
        return false;
    }
    // CRITICAL: Remove from cache
    await (0, cache_service_js_1.invalidateCachedUrl)(shortId);
    return true;
}
//# sourceMappingURL=url.service.js.map