import { Router } from "express";
import { generateQrCodeHandler } from "../controllers/qrcode.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireProPlan } from "../middlewares/plan.middleware.js";
import { apiLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = Router();

router.get("/:id/qrcode", requireAuth, apiLimiter, requireProPlan, generateQrCodeHandler);

export default router;
