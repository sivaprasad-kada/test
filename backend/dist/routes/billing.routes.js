"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const billing_controller_js_1 = require("../controllers/billing.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const rateLimiter_middleware_js_1 = require("../middlewares/rateLimiter.middleware.js");
const router = (0, express_1.Router)();
router.post("/create-subscription", auth_middleware_js_1.requireAuth, rateLimiter_middleware_js_1.apiLimiter, billing_controller_js_1.createSubscription);
exports.default = router;
//# sourceMappingURL=billing.routes.js.map