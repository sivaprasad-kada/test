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

    if (forwarded) {
        const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
        return ip.trim();
    }

    // Fallback to socket remote address
    return req.socket.remoteAddress || "unknown";
}
