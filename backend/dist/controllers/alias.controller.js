"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAliasAvailability = checkAliasAvailability;
const Url_model_js_1 = require("../models/Url.model.js");
const RESERVED_ALIASES = new Set([
    "login",
    "signup",
    "admin",
    "dashboard",
    "api",
    "billing",
    "pricing",
    "health",
]);
async function checkAliasAvailability(req, res) {
    try {
        const alias = req.params.alias?.trim().toLowerCase();
        if (!alias) {
            return res.status(400).json({ error: "Alias parameter is required" });
        }
        // 1. Regex validation
        if (!/^[a-zA-Z0-9_-]{3,30}$/.test(alias)) {
            return res.json({ available: false });
        }
        // 2. Reserved Keyword check
        if (RESERVED_ALIASES.has(alias)) {
            return res.json({ available: false });
        }
        // 3. Database check
        const existing = await Url_model_js_1.UrlModel.findOne({ shortId: alias }).select("_id").lean();
        if (existing) {
            return res.json({ available: false });
        }
        return res.json({ available: true });
    }
    catch (error) {
        console.error("[Alias Controller] Check availability error:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}
//# sourceMappingURL=alias.controller.js.map