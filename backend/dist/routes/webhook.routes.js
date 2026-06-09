"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webhook_controller_js_1 = require("../controllers/webhook.controller.js");
const router = (0, express_1.Router)();
// POST /api/webhooks/razorpay
router.post("/razorpay", webhook_controller_js_1.razorpayWebhookHandler);
exports.default = router;
//# sourceMappingURL=webhook.routes.js.map