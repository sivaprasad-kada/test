import { getRedisClient } from "../config/redis.js";
import baseX from "base-x";

/**
 * Short Code Generator
 * ────────────────────
 * Generates unique short codes using Redis INCR + Base62 encoding.
 *
 * Uses Redis INCR for the atomic counter instead of MongoDB,
 * which is faster and avoids write contention on the database.
 *
 * Redis key: url_counter
 * Encoding:  Base62 (0-9, a-z, A-Z) for URL-safe short codes
 */

const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const base62 = baseX(BASE62);

export async function generateShortCode(length: number = 6): Promise<string> {
  const redis = getRedisClient();

  // Atomic counter increment — no race conditions
  const count = await redis.incr("url_counter");

  // Encode the counter value as Base62
  const shortCode = base62.encode(Buffer.from(count.toString()));

  // Pad to desired length for consistent URL aesthetics
  return shortCode.slice(0, length).padStart(length, "0");
}