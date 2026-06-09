"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const alias_controller_js_1 = require("../controllers/alias.controller.js");
const rateLimiter_middleware_js_1 = require("../middlewares/rateLimiter.middleware.js");
const router = (0, express_1.Router)();
// Expose alias check endpoint (unauthenticated or authenticated; public check is useful on frontend form)
router.get("/check/:alias", rateLimiter_middleware_js_1.apiLimiter, alias_controller_js_1.checkAliasAvailability);
exports.default = router;
//# sourceMappingURL=alias.routes.js.map