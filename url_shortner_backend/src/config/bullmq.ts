import { ConnectionOptions } from "bullmq";

/**
 * BullMQ Connection Config
 * ────────────────────────
 * BullMQ uses its own ioredis connection under the hood.
 * This config provides a consistent connection object
 * for both Queue and Worker instances.
 *
 * NOTE: BullMQ does NOT use the `redis` npm client;
 * it requires raw { host, port, ... } or an ioredis instance.
 */

function parseRedisUrl(url: string): { host: string; port: number; password?: string } {
    try {
        const parsed = new URL(url);
        return {
            host: parsed.hostname || "localhost",
            port: parseInt(parsed.port, 10) || 6379,
            ...(parsed.password ? { password: parsed.password } : {}),
        };
    } catch {
        return { host: "localhost", port: 6379 };
    }
}

export function getBullMQConnection(): ConnectionOptions {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    return parseRedisUrl(redisUrl);
}
