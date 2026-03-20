import {
    scanAnalyticsKeys,
    getAnalyticsHash,
    getUniqueVisitors,
    deleteAnalyticsKeys,
} from "../services/analytics.service.js";
import { AnalyticsModel } from "../models/Analytics.model.js";
import { UrlModel } from "../models/Url.model.js";

/**
 * Aggregation Worker
 * ──────────────────
 * Syncs analytics data from Redis → MongoDB.
 *
 * Called periodically by the aggregation scheduler (every 5 min).
 *
 * Steps:
 *   1. SCAN Redis for analytics:* keys
 *   2. For each key, read the HASH and HyperLogLog
 *   3. Parse counters into structured data
 *   4. Upsert into MongoDB (one document per shortId per day)
 *   5. Delete processed Redis keys
 *
 * This batch approach is far more efficient than writing to
 * MongoDB on every click.
 */

export async function runAggregation(): Promise<void> {
    console.log("[Aggregator] Starting Redis → MongoDB sync...");

    const keys = await scanAnalyticsKeys();

    if (keys.length === 0) {
        console.log("[Aggregator] No pending analytics keys. Skipping.");
        return;
    }

    console.log(`[Aggregator] Found ${keys.length} analytics key(s) to process.`);

    let successCount = 0;
    let errorCount = 0;

    for (const key of keys) {
        try {
            // Parse key: analytics:{shortId}:{date}
            const parts = key.split(":");
            if (parts.length < 3) {
                console.warn(`[Aggregator] Skipping malformed key: ${key}`);
                continue;
            }

            const shortId = parts[1];
            const date = parts[2];

            // Step 1: Read the Redis HASH
            const hash = await getAnalyticsHash(shortId, date);

            if (!hash || Object.keys(hash).length === 0) {
                // Key exists but hash is empty — clean up
                await deleteAnalyticsKeys(shortId, date);
                continue;
            }

            // Step 2: Read unique visitors from HyperLogLog
            const uniqueVisitors = await getUniqueVisitors(shortId, date);

            // Step 3: Parse the hash into structured analytics
            const totalClicks = parseInt(hash["totalClicks"] || "0", 10);
            const countries: Record<string, number> = {};
            const browsers: Record<string, number> = {};
            const devices: Record<string, number> = {};

            for (const [field, value] of Object.entries(hash)) {
                const numValue = parseInt(value, 10);

                if (field.startsWith("country:")) {
                    const countryCode = field.replace("country:", "");
                    countries[countryCode] = numValue;
                } else if (field.startsWith("browser:")) {
                    const browserName = field.replace("browser:", "");
                    browsers[browserName] = numValue;
                } else if (field.startsWith("device:")) {
                    const deviceType = field.replace("device:", "");
                    devices[deviceType] = numValue;
                }
            }

            // Step 4: Upsert into MongoDB
            // Using $inc for counters ensures idempotent-ish merging
            // even if the aggregator runs twice before keys are deleted.
            const updateOps: Record<string, any> = {
                $inc: { totalClicks },
                // Use $max so if Redis loses the uKey data due to restart, we don't overwrite MongoDB with a lower count.
                $max: { uniqueVisitors },
            };

            // Build $inc paths for nested counters
            for (const [code, count] of Object.entries(countries)) {
                updateOps.$inc[`countries.${code}`] = count;
            }
            for (const [name, count] of Object.entries(browsers)) {
                updateOps.$inc[`browsers.${name}`] = count;
            }
            for (const [type, count] of Object.entries(devices)) {
                updateOps.$inc[`devices.${type}`] = count;
            }

            const urlDoc = await UrlModel.findOne({ shortId }).select("_id userId").lean();
            if (!urlDoc) {
                await deleteAnalyticsKeys(shortId, date);
                continue;
            }

            updateOps.$setOnInsert = {
                urlId: urlDoc._id,
                userId: urlDoc.userId
            };

            await AnalyticsModel.findOneAndUpdate(
                { shortId, date },
                updateOps,
                { upsert: true, new: true }
            );

            // Step 5: Delete Redis keys after successful sync
            await deleteAnalyticsKeys(shortId, date);

            successCount++;
        } catch (error: any) {
            errorCount++;
            console.error(`[Aggregator] Failed to process key "${key}":`, error.message);
            // Don't delete the key — it will be retried next cycle
        }
    }

    console.log(
        `[Aggregator] Sync complete. Success: ${successCount}, Errors: ${errorCount}`
    );
}
