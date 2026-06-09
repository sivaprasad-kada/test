import { Router } from "express";
import { createSubscription } from "../controllers/billing.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { apiLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = Router();

router.post("/create-subscription", requireAuth, apiLimiter, createSubscription);

export default router;
