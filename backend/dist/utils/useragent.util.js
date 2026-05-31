"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseUserAgent = parseUserAgent;
const ua_parser_js_1 = require("ua-parser-js");
function parseUserAgent(uaString) {
    const parser = new ua_parser_js_1.UAParser(uaString || "");
    const result = parser.getResult();
    const browser = (result.browser.name || "unknown").toLowerCase().replace(/\s+/g, "-");
    // ua-parser-js returns device.type only for mobile/tablet;
    // if undefined, we assume desktop.
    const deviceType = result.device.type || "desktop";
    const device = deviceType.toLowerCase().replace(/\s+/g, "-");
    return { browser, device };
}
//# sourceMappingURL=useragent.util.js.map