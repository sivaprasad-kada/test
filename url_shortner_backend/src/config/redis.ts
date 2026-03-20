import { createClient, RedisClientType } from "redis";

/**
 * Redis Client Singleton
 * ──────────────────────
 * Creates and manages a single Redis connection used across the app
 * for caching (url:{shortId}), analytics counters, and HyperLogLog.
 *
 * The connection is lazy — call `connectRedis()` once at startup.
 */

let redisClient: RedisClientType;

export function getRedisClient(): RedisClientType {
    if (!redisClient) {
        const url = process.env.REDIS_URL || "redis://localhost:6379";

        redisClient = createClient({ url });

        redisClient.on("error", (err) => {
            console.error("[Redis] Connection error:", err);
        });

        redisClient.on("connect", () => {
            console.log("[Redis] Connected successfully");
        });

        redisClient.on("reconnecting", () => {
            console.warn("[Redis] Reconnecting...");
        });
    }

    return redisClient;
}

/**
 * Connects to Redis — call once during server bootstrap.
 */
export async function connectRedis(): Promise<void> {
    const client = getRedisClient();
    if (!client.isOpen) {
        await client.connect();
    }
}

/**
 * Gracefully disconnect Redis — call during shutdown.
 */
export async function disconnectRedis(): Promise<void> {
    const client = getRedisClient();
    if (client.isOpen) {
        await client.quit();
        console.log("[Redis] Disconnected gracefully");
    }
}
