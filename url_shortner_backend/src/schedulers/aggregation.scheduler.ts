import cron from "node-cron";
import { runAggregation } from "../workers/aggregation.worker.js";

/**
 * Aggregation Scheduler
 * ─────────────────────
 * Runs the Redis → MongoDB sync on a periodic schedule.
 *
 * Default: every 5 minutes (configurable via AGGREGATION_CRON env var).
 *
 * Uses node-cron for reliable scheduling within the Node.js process.
 * In a production multi-instance deployment, you would use a
 * distributed lock (e.g., Redlock) to ensure only one instance
 * runs the aggregation at a time.
 */

let isRunning = false;

export function startAggregationScheduler(): void {
    const cronExpression = process.env.AGGREGATION_CRON || "*/5 * * * *";

    console.log(`[Scheduler] Aggregation scheduled: "${cronExpression}"`);

    cron.schedule(cronExpression, async () => {
        // Prevent overlapping runs
        if (isRunning) {
            console.log("[Scheduler] Previous aggregation still running. Skipping.");
            return;
        }

        isRunning = true;

        try {
            await runAggregation();
        } catch (error: any) {
            console.error("[Scheduler] Aggregation failed:", error.message);
        } finally {
            isRunning = false;
        }
    });
}
