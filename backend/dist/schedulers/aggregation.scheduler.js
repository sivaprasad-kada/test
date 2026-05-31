"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAggregationScheduler = startAggregationScheduler;
const node_cron_1 = __importDefault(require("node-cron"));
const aggregation_worker_js_1 = require("../workers/aggregation.worker.js");
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
function startAggregationScheduler() {
    const cronExpression = process.env.AGGREGATION_CRON || "*/5 * * * *";
    console.log(`[Scheduler] Aggregation scheduled: "${cronExpression}"`);
    node_cron_1.default.schedule(cronExpression, async () => {
        // Prevent overlapping runs
        if (isRunning) {
            console.log("[Scheduler] Previous aggregation still running. Skipping.");
            return;
        }
        isRunning = true;
        try {
            await (0, aggregation_worker_js_1.runAggregation)();
        }
        catch (error) {
            console.error("[Scheduler] Aggregation failed:", error.message);
        }
        finally {
            isRunning = false;
        }
    });
}
//# sourceMappingURL=aggregation.scheduler.js.map