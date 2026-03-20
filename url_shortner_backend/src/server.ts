import "dotenv/config";
import app from "./app.js";
import { connectMongo } from "./config/mongo.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";
import { startAggregationScheduler } from "./schedulers/aggregation.scheduler.js";

// Import the worker so it starts processing jobs
import "./workers/analytics.worker.js";

/**
 * Server Bootstrap
 * ────────────────
 * Initializes all infrastructure connections, starts the
 * analytics worker, aggregation scheduler, and HTTP server.
 *
 * Startup order:
 *   1. Load environment variables (dotenv)
 *   2. Connect to MongoDB
 *   3. Connect to Redis
 *   4. Start BullMQ analytics worker (via import)
 *   5. Start aggregation scheduler (node-cron)
 *   6. Start Express HTTP server
 *
 * Shutdown:
 *   - Gracefully closes Redis and MongoDB connections
 *   - Stops accepting new requests
 */

const PORT = parseInt(process.env.PORT || "3000", 10); //here 10 is radix(base) value

async function bootstrap(): Promise<void> {
  try {
    // Step 1: Connect to MongoDB
    await connectMongo();

    // Step 2: Connect to Redis
    await connectRedis();

    // Step 3: Start the aggregation scheduler (Redis → MongoDB sync)
    startAggregationScheduler();

    // Step 4: Start Express server
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 URL Shortener server running on port ${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/health`);
      console.log(`   API:    http://localhost:${PORT}/api/url\n`);
    });

    // ─── Graceful Shutdown ─────────────────────────────

    const shutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);

      server.close(async () => {
        try {
          await disconnectRedis();
          console.log("[Server] All connections closed. Goodbye! 👋");
          process.exit(0);
        } catch (err) {
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
  } catch (error) {
    console.error("[Server] Failed to start:", error);
    process.exit(1);
  }
}

bootstrap();