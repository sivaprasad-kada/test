"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsWorker = void 0;
const bullmq_1 = require("bullmq");
const bullmq_js_1 = require("../config/bullmq.js");
const analytics_service_js_1 = require("../services/analytics.service.js");
/**
 * Analytics Worker
 * ────────────────
 * Processes "trackClick" jobs from the analyticsQueue.
 *
 * Instead of writing directly to MongoDB (which would be slow),
 * this worker updates Redis counters using HINCRBY and PFADD.
 *
 * The periodic aggregation scheduler later syncs these counters
 * from Redis → MongoDB in batch.
 *
 * Flow:
 *   BullMQ job → Worker → Redis HINCRBY / PFADD → done
 *                                    ↓
 *                         (later) Aggregator → MongoDB
 */
const concurrency = parseInt(process.env.QUEUE_CONCURRENCY || "5", 10);
exports.analyticsWorker = new bullmq_1.Worker("analyticsQueue", async (job) => {
    const data = job.data;
    // Build the analytics data object
    const analyticsData = {
        shortId: data.shortId,
        ip: data.ip,
        country: data.country,
        city: data.city,
        browser: data.browser,
        device: data.device,
        referrer: data.referrer,
        timestamp: data.timestamp,
    };
    // Update Redis counters (HINCRBY + PFADD)
    await (0, analytics_service_js_1.recordAnalytics)(analyticsData);
    return { processed: true, shortId: data.shortId };
}, {
    connection: (0, bullmq_js_1.getBullMQConnection)(),
    concurrency,
});
// ─── Worker Lifecycle Events ─────────────────────────
exports.analyticsWorker.on("completed", (job) => {
    // Minimal logging — avoid heavy I/O on every job
    if (process.env.NODE_ENV !== "production") {
        console.log(`[Worker] Job ${job.id} completed for ${job.data.shortId}`);
    }
});
exports.analyticsWorker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});
exports.analyticsWorker.on("error", (err) => {
    console.error("[Worker] Error:", err.message);
});
console.log(`[Worker] Analytics worker started (concurrency: ${concurrency})`);
//# sourceMappingURL=analytics.worker.js.map