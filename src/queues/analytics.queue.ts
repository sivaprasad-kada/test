import { Queue } from "bullmq";
import { getBullMQConnection } from "../config/bullmq.js";

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

export const analyticsQueue = new Queue("analyticsQueue", {
    connection: getBullMQConnection(),
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

/**
 * Analytics Job Data — the payload pushed to the queue.
 */
export interface AnalyticsJobData {
    shortId: string;
    ip: string;
    country: string;
    city: string;
    browser: string;
    device: string;
    referrer: string;
    timestamp: string;
}

/**
 * Enqueue an analytics tracking job.
 * Called from the redirect controller.
 */
export async function enqueueAnalyticsJob(data: AnalyticsJobData): Promise<void> {
    await analyticsQueue.add("trackClick", data);
}
