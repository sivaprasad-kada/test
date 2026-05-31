"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_js_1 = require("../controllers/auth.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const rateLimiter_middleware_js_1 = require("../middlewares/rateLimiter.middleware.js");
const index_js_1 = require("../validators/index.js");
const router = (0, express_1.Router)();
router.post("/register", rateLimiter_middleware_js_1.authLimiter, (0, index_js_1.validate)(index_js_1.registerSchema), auth_controller_js_1.register);
router.post("/login", rateLimiter_middleware_js_1.authLimiter, (0, index_js_1.validate)(index_js_1.loginSchema), auth_controller_js_1.login);
router.post("/logout", auth_middleware_js_1.requireAuth, auth_controller_js_1.logout);
router.get("/me", auth_middleware_js_1.requireAuth, auth_controller_js_1.getMe);
router.get("/google", auth_controller_js_1.googleAuth);
router.get("/google/callback", auth_controller_js_1.googleAuthCallback);
router.get("/github", auth_controller_js_1.githubAuth);
router.get("/github/callback", auth_controller_js_1.githubAuthCallback);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map