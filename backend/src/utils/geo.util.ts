import geoip from "geoip-lite";

/**
 * GeoIP Utility
 * ─────────────
 * Uses geoip-lite to resolve an IP address into country and city.
 * Returns lowercase values for consistent Redis hash field names.
 *
 * NOTE: geoip-lite uses an in-memory MaxMind database.
 * It is fast (microseconds) and does NOT make external HTTP calls,
 * so it is safe to use even inside hot paths. However, we still
 * use it inside the background worker for architectural cleanliness.
 */

export interface GeoData {
    country: string;
    city: string;
}

export function lookupGeo(ip: string): GeoData {
    // Normalize IPv6-mapped IPv4 (e.g., ::ffff:127.0.0.1 → 127.0.0.1)
    const cleanIp = ip.replace(/^::ffff:/, "");

    const geo = geoip.lookup(cleanIp);

    if (!geo) {
        return { country: "unknown", city: "unknown" };
    }

    return {
        country: (geo.country || "unknown").toLowerCase(),
        city: (geo.city || "unknown").toLowerCase().replace(/\s+/g, "-"),
    };
}
