import { Worker, Job } from "bullmq";
import { getBullMQConnection } from "../config/bullmq.js";
import { recordAnalytics, AnalyticsData } from "../services/analytics.service.js";
import { AnalyticsJobData } from "../queues/analytics.queue.js";

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

export const analyticsWorker = new Worker(
    "analyticsQueue",
    async (job: Job<AnalyticsJobData>) => {
        const data = job.data;

        // Build the analytics data object
        const analyticsData: AnalyticsData = {
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
        await recordAnalytics(analyticsData);

        return { processed: true, shortId: data.shortId };
    },
    {
        connection: getBullMQConnection(),
        concurrency,
    }
);

// ─── Worker Lifecycle Events ─────────────────────────

analyticsWorker.on("completed", (job) => {
    // Minimal logging — avoid heavy I/O on every job
    if (process.env.NODE_ENV !== "production") {
        console.log(`[Worker] Job ${job.id} completed for ${job.data.shortId}`);
    }
});

analyticsWorker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

analyticsWorker.on("error", (err) => {
    console.error("[Worker] Error:", err.message);
});

console.log(`[Worker] Analytics worker started (concurrency: ${concurrency})`);
