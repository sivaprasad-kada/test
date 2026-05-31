"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueueAnalyticsJob = enqueueAnalyticsJob;
const bullmq_1 = require("bullmq");
const bullmq_js_1 = require("../config/bullmq.js");
/**
 * Analytics Queue
 * ───────────────
 * BullMQ queue for asynchronous analytics processing.
 *
 * During a redirect, the controller pushes a lightweight job
 * into this queue. The analytics worker picks it up in the
 * background and updates Redis counters.
 *
 * This decoupling ensures the redirect response is never
 * blocked by analytics processing.
 *
 * Queue name: "analyticsQueue"
 * Job name:   "trackClick"
 */
let analyticsQueue = null;
function getAnalyticsQueue() {
    if (!analyticsQueue) {
        analyticsQueue = new bullmq_1.Queue("analyticsQueue", {
            connection: (0, bullmq_js_1.getBullMQConnection)(),
            defaultJobOptions: {
                // Retry failed jobs with exponential backoff
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 1000, // 1s, 2s, 4s
                },
                // Remove completed jobs after 1 hour to save memory
                removeOnComplete: {
                    age: 3600,
                },
                // Keep failed jobs for 24 hours for debugging
                removeOnFail: {
                    age: 86400,
                },
            },
        });
        analyticsQueue.on("error", (err) => {
            console.error("[Queue] Analytics queue error:", err.message);
        });
    }
    return analyticsQueue;
}
/**
 * Enqueue an analytics tracking job.
 * Called from the redirect controller.
 * Gracefully handles queue failures — never throws.
 */
async function enqueueAnalyticsJob(data) {
    try {
        const queue = getAnalyticsQueue();
        await queue.add("trackClick", data);
    }
    catch (err) {
        console.error("[Queue] Failed to enqueue analytics job:", err.message);
        // Silently fail — analytics is non-critical
    }
}
//# sourceMappingURL=analytics.queue.js.map