import { UAParser, IResult } from "ua-parser-js";

/**
 * User-Agent Parsing Utility
 * ──────────────────────────
 * Parses the User-Agent header using ua-parser-js to extract:
 *   - browser name (e.g., chrome, firefox, safari)
 *   - device type (e.g., mobile, tablet, desktop)
 *
 * Returns lowercase, sanitized values for consistent Redis keys.
 */

export interface ParsedUserAgent {
    browser: string;
    device: string;
}

export function parseUserAgent(uaString: string | undefined): ParsedUserAgent {
    const parser = new UAParser(uaString || "");
    const result = parser.getResult();

    const browser = (result.browser.name || "unknown").toLowerCase().replace(/\s+/g, "-");

    // ua-parser-js returns device.type only for mobile/tablet;
    // if undefined, we assume desktop.
    const deviceType = result.device.type || "desktop";
    const device = deviceType.toLowerCase().replace(/\s+/g, "-");

    return { browser, device };
}
