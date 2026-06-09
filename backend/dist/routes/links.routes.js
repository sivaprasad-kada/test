"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const qrcode_controller_js_1 = require("../controllers/qrcode.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const plan_middleware_js_1 = require("../middlewares/plan.middleware.js");
const rateLimiter_middleware_js_1 = require("../middlewares/rateLimiter.middleware.js");
const router = (0, express_1.Router)();
router.get("/:id/qrcode", auth_middleware_js_1.requireAuth, rateLimiter_middleware_js_1.apiLimiter, plan_middleware_js_1.requireProPlan, qrcode_controller_js_1.generateQrCodeHandler);
exports.default = router;
//# sourceMappingURL=links.routes.js.map