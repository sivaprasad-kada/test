"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShortUrlHandler = createShortUrlHandler;
exports.getUserUrlsHandler = getUserUrlsHandler;
exports.getAnalyticsHandler = getAnalyticsHandler;
exports.updateUrlHandler = updateUrlHandler;
exports.deleteUrlHandler = deleteUrlHandler;
const url_service_js_1 = require("../services/url.service.js");
/**
 * URL Shortening Controller
 * ─────────────────────────
 * Handles CRUD operations for URL management.
 */
const User_model_js_1 = require("../models/User.model.js");
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
// POST /api/url — Create a new short URL
async function createShortUrlHandler(req, res) {
    try {
        let { url, customAlias } = req.body;
        // Zod validation ensures url and customAlias format/rules are met if provided
        if (!/^https?:\/\//i.test(url)) {
            url = `https://${url}`;
        }
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const user = await User_model_js_1.UserModel.findById(userId);
        if (!user) {
            return res.status(401).json({ error: "Unauthorized - User not found" });
        }
        let aliasToUse = undefined;
        if (customAlias && customAlias.trim() !== "") {
            // Check plan
            if (user.plan !== "PRO") {
                return res.status(403).json({
                    error: "Feature restricted",
                    message: "Custom aliases are only available in the PRO plan.",
                });
            }
            const sanitizedAlias = customAlias.trim().toLowerCase();
            // Validate alias format
            if (!/^[a-zA-Z0-9_-]{3,30}$/.test(sanitizedAlias)) {
                return res.status(400).json({
                    error: "Validation failed",
                    message: "Alias must be 3-30 characters and contain only letters, numbers, hyphens or underscores.",
                });
            }
            // Check reserved keywords
            if (RESERVED_ALIASES.has(sanitizedAlias)) {
                return res.status(400).json({
                    error: "Validation failed",
                    message: "This alias is reserved and cannot be used.",
                });
            }
            // Check availability in DB
            const existing = await Url_model_js_1.UrlModel.findOne({ shortId: sanitizedAlias }).select("_id").lean();
            if (existing) {
                return res.status(400).json({
                    error: "Validation failed",
                    message: "Alias is already taken.",
                });
            }
            aliasToUse = sanitizedAlias;
        }
        const shortId = await (0, url_service_js_1.createShortUrl)(url, userId, aliasToUse);
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        return res.status(201).json({
            shortId,
            shortUrl: `${baseUrl}/${shortId}`,
            longUrl: url,
        });
    }
    catch (error) {
        console.error("[URL Controller] Create error:", error.message);
        return res.status(500).json({ error: error.message });
    }
}
// GET /api/url — Get all URLs for the current user
async function getUserUrlsHandler(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const urls = await (0, url_service_js_1.getUserUrls)(userId);
        return res.json(urls);
    }
    catch (error) {
        console.error("[URL Controller] Get URLs error:", error.message);
        return res.status(500).json({ error: "Failed to fetch URLs" });
    }
}
// GET /api/url/:shortId/analytics — Get analytics for a specific URL
async function getAnalyticsHandler(req, res) {
    try {
        const shortId = req.params.shortId;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const user = await User_model_js_1.UserModel.findById(userId);
        if (!user) {
            return res.status(401).json({ error: "Unauthorized - User not found" });
        }
        const analytics = await (0, url_service_js_1.getAnalytics)(shortId, userId);
        if (user.plan !== "PRO") {
            const strippedAnalytics = analytics.map((entry) => {
                const obj = typeof entry.toObject === "function" ? entry.toObject() : { ...entry };
                obj.countries = {};
                obj.browsers = {};
                obj.devices = {};
                return obj;
            });
            return res.json(strippedAnalytics);
        }
        return res.json(analytics);
    }
    catch (error) {
        console.error("[URL Controller] Get Analytics error:", error.message);
        return res.status(500).json({ error: "Failed to fetch analytics" });
    }
}
// PUT /api/url/:shortId — Update a URL's destination
async function updateUrlHandler(req, res) {
    try {
        const shortId = req.params.shortId;
        let { url } = req.body;
        // Zod validation ensures url is present and valid
        if (!/^https?:\/\//i.test(url)) {
            url = `https://${url}`;
        }
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const updated = await (0, url_service_js_1.updateUrl)(shortId, url, userId);
        if (!updated) {
            return res.status(404).json({ error: "Short URL not found" });
        }
        return res.json({ message: "URL updated successfully", shortId });
    }
    catch (error) {
        console.error("[URL Controller] Update error:", error.message);
        return res.status(500).json({ error: "Failed to update URL" });
    }
}
// DELETE /api/url/:shortId — Delete a URL mapping
async function deleteUrlHandler(req, res) {
    try {
        const shortId = req.params.shortId;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const deleted = await (0, url_service_js_1.deleteUrl)(shortId, userId);
        if (!deleted) {
            return res.status(404).json({ error: "Short URL not found" });
        }
        return res.json({ message: "URL deleted successfully", shortId });
    }
    catch (error) {
        console.error("[URL Controller] Delete error:", error.message);
        return res.status(500).json({ error: "Failed to delete URL" });
    }
}
//# sourceMappingURL=url.controller.js.map