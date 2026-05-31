"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const redirect_controller_js_1 = require("../controllers/redirect.controller.js");
const rateLimiter_middleware_js_1 = require("../middlewares/rateLimiter.middleware.js");
/**
 * Redirect Routes
 * ───────────────
 * GET /:shortId — resolves and redirects to the original URL.
 *
 * This route MUST be registered LAST in the Express app
 * so it doesn't catch other routes like /api/* or /health.
 */
const router = (0, express_1.Router)();
router.get("/:shortId", rateLimiter_middleware_js_1.redirectLimiter, redirect_controller_js_1.redirectUrl);
exports.default = router;
//# sourceMappingURL=redirect.routes.js.map