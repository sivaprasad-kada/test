"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const url_controller_js_1 = require("../controllers/url.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const rateLimiter_middleware_js_1 = require("../middlewares/rateLimiter.middleware.js");
const index_js_1 = require("../validators/index.js");
/**
 * URL Management Routes
 * ─────────────────────
 * CRUD operations for short URLs.
 *
 * POST   /api/url           — Create a new short URL
 * GET    /api/url            — Get all user URLs
 * GET    /api/url/:shortId/analytics — Get analytics for a URL
 * PUT    /api/url/:shortId  — Update destination URL (+ cache invalidation)
 * DELETE /api/url/:shortId  — Delete a URL mapping (+ cache invalidation)
 */
const router = (0, express_1.Router)();
router.use(auth_middleware_js_1.requireAuth);
router.use(rateLimiter_middleware_js_1.apiLimiter);
router.get("/", url_controller_js_1.getUserUrlsHandler);
router.post("/", (0, index_js_1.validate)(index_js_1.createUrlSchema), url_controller_js_1.createShortUrlHandler);
router.get("/:shortId/analytics", url_controller_js_1.getAnalyticsHandler);
router.put("/:shortId", (0, index_js_1.validate)(index_js_1.createUrlSchema), url_controller_js_1.updateUrlHandler);
router.delete("/:shortId", url_controller_js_1.deleteUrlHandler);
exports.default = router;
//# sourceMappingURL=url.routes.js.map