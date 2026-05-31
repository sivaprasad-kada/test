import { Request } from "express";

/**
 * IP Extraction Utility
 * ─────────────────────
 * Extracts the client's real IP address from the request.
 * Supports reverse proxies by checking `x-forwarded-for` first,
 * then falls back to `socket.remoteAddress`.
 *
 * When behind a proxy (Nginx, Cloudflare, etc.), the first IP
 * in x-forwarded-for is typically the real client IP.
 */

export function extractIp(req: Request): string {
    // x-forwarded-for can be a comma-separated list of IPs
    const forwarded = req.headers["x-forwarded-for"];

    let ip = "unknown";
    if (forwarded) {
        ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    } else {
        // Fallback to socket remote address
        ip = req.socket.remoteAddress || "unknown";
    }

    ip = ip.trim();

    // For local development testing, mock a public IP if it's localhost
    // so GeoIP can actually return test details instead of "unknown".
    if (ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1") {
        ip = "8.8.8.8"; // Mountain View, US
    }

    return ip;
}
