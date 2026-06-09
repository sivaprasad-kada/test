import { Router } from "express";
import { razorpayWebhookHandler } from "../controllers/webhook.controller.js";

const router = Router();

// POST /api/webhooks/razorpay
router.post("/razorpay", razorpayWebhookHandler);

export default router;
