"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = getRedisClient;
exports.isRedisReady = isRedisReady;
exports.connectRedis = connectRedis;
exports.disconnectRedis = disconnectRedis;
exports.safeRedisOp = safeRedisOp;
const redis_1 = require("redis");
/**
 * Redis Client Singleton
 * ──────────────────────
 * Creates and manages a single Redis connection used across the app
 * for caching (url:{shortId}), analytics counters, and HyperLogLog.
 *
 * Graceful Degradation:
 *   - Redis is an optimization layer, NOT required for the app to run.
 *   - If Redis is down, the app falls back to MongoDB for reads.
 *   - Analytics may temporarily degrade, but redirects still work.
 *   - The app never calls process.exit() on Redis failure.
 */
let redisClient;
let redisReady = false;
function getRedisClient() {
    if (!redisClient) {
        const url = process.env.REDIS_URL || "redis://localhost:6379";
        redisClient = (0, redis_1.createClient)({
            url,
            socket: {
                reconnectStrategy: (retries) => {
                    // Exponential backoff: 1s, 2s, 4s, ... max 30s
                    const delay = Math.min(retries * 1000, 30000);
                    console.warn(`[Redis] Reconnect attempt #${retries}, next in ${delay}ms`);
                    return delay;
                },
            },
        });
        redisClient.on("error", (err) => {
            redisReady = false;
            console.error("[Redis] Connection error:", err.message);
        });
        redisClient.on("connect", () => {
            console.log("[Redis] Connecting...");
        });
        redisClient.on("ready", () => {
            redisReady = true;
            console.log("[Redis] Ready and accepting commands");
        });
        redisClient.on("reconnecting", () => {
            redisReady = false;
            console.warn("[Redis] Reconnecting...");
        });
        redisClient.on("end", () => {
            redisReady = false;
            console.warn("[Redis] Connection closed");
        });
    }
    return redisClient;
}
/**
 * Check if Redis is connected and ready to accept commands.
 * Used by services to decide whether to attempt Redis operations.
 */
function isRedisReady() {
    return redisReady && redisClient?.isOpen === true;
}
/**
 * Connects to Redis — call once during server bootstrap.
 * Does NOT throw or exit on failure — logs the error and continues.
 */
async function connectRedis() {
    try {
        const client = getRedisClient();
        if (!client.isOpen) {
            await client.connect();
        }
    }
    catch (err) {
        console.error("[Redis] Initial connection failed:", err.message);
        console.warn("[Redis] App will continue without Redis. Features will degrade gracefully.");
    }
}
/**
 * Gracefully disconnect Redis — call during shutdown.
 */
async function disconnectRedis() {
    try {
        const client = getRedisClient();
        if (client.isOpen) {
            await client.quit();
            console.log("[Redis] Disconnected gracefully");
        }
    }
    catch (err) {
        console.error("[Redis] Error during disconnect:", err.message);
    }
}
/**
 * Safe wrapper for Redis operations.
 * If Redis is down, returns the provided fallback value instead of throwing.
 * This avoids repetitive try/catch in every service.
 */
async function safeRedisOp(operation, fallback, context = "Redis") {
    if (!isRedisReady()) {
        return fallback;
    }
    try {
        return await operation();
    }
    catch (err) {
        console.error(`[${context}] Redis operation failed:`, err.message);
        return fallback;
    }
}
//# sourceMappingURL=redis.js.map