"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_js_1 = __importDefault(require("./app.js"));
const mongo_js_1 = require("./config/mongo.js");
const redis_js_1 = require("./config/redis.js");
const aggregation_scheduler_js_1 = require("./schedulers/aggregation.scheduler.js");
// Import the worker so it starts processing jobs
require("./workers/analytics.worker.js");
/**
 * Server Bootstrap
 * ────────────────
 * Initializes all infrastructure connections, starts the
 * analytics worker, aggregation scheduler, and HTTP server.
 *
 * Startup order:
 *   1. Load environment variables (dotenv)
 *   2. Connect to MongoDB (required — app exits if fails)
 *   3. Connect to Redis (optional — app continues if fails)
 *   4. Start BullMQ analytics worker (via import)
 *   5. Start aggregation scheduler (node-cron)
 *   6. Start Express HTTP server
 *
 * Shutdown:
 *   - Gracefully closes Redis and MongoDB connections
 *   - Stops accepting new requests
 */
const PORT = parseInt(process.env.PORT || "3000", 10);
async function bootstrap() {
    try {
        // Step 1: Connect to MongoDB (REQUIRED — source of truth)
        await (0, mongo_js_1.connectMongo)();
        // Step 2: Connect to Redis (OPTIONAL — app degrades gracefully if down)
        await (0, redis_js_1.connectRedis)();
        // Step 3: Start the aggregation scheduler (Redis → MongoDB sync)
        (0, aggregation_scheduler_js_1.startAggregationScheduler)();
        // Step 4: Start Express server
        const server = app_js_1.default.listen(PORT, () => {
            console.log(`\n🚀 URL Shortener server running on port ${PORT}`);
            console.log(`   Health: http://localhost:${PORT}/health`);
            console.log(`   API:    http://localhost:${PORT}/api/url\n`);
        });
        // ─── Graceful Shutdown ─────────────────────────────
        const shutdown = async (signal) => {
            console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
            server.close(async () => {
                try {
                    await (0, redis_js_1.disconnectRedis)();
                    console.log("[Server] All connections closed. Goodbye! 👋");
                    process.exit(0);
                }
                catch (err) {
                    console.error("[Server] Error during shutdown:", err);
                    process.exit(1);
                }
            });
            // Force shutdown after 10 seconds
            setTimeout(() => {
                console.error("[Server] Forced shutdown after timeout.");
                process.exit(1);
            }, 10000);
        };
        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));
    }
    catch (error) {
        console.error("[Server] Failed to start:", error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=server.js.map