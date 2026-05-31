"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lookupGeo = lookupGeo;
const geoip_lite_1 = __importDefault(require("geoip-lite"));
function lookupGeo(ip) {
    // Normalize IPv6-mapped IPv4 (e.g., ::ffff:127.0.0.1 → 127.0.0.1)
    const cleanIp = ip.replace(/^::ffff:/, "");
    const geo = geoip_lite_1.default.lookup(cleanIp);
    if (!geo) {
        return { country: "unknown", city: "unknown" };
    }
    return {
        country: (geo.country || "unknown").toLowerCase(),
        city: (geo.city || "unknown").toLowerCase().replace(/\s+/g, "-"),
    };
}
//# sourceMappingURL=geo.util.js.map