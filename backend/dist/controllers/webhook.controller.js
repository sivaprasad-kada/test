"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.razorpayWebhookHandler = razorpayWebhookHandler;
const crypto_1 = __importDefault(require("crypto"));
const User_model_js_1 = require("../models/User.model.js");
const env_js_1 = require("../config/env.js");
async function razorpayWebhookHandler(req, res) {
    try {
        const signature = req.headers["x-razorpay-signature"];
        const rawBody = req.rawBody || JSON.stringify(req.body);
        if (!signature) {
            console.warn("[Webhook] Missing x-razorpay-signature header");
            return res.status(400).json({ error: "Missing signature" });
        }
        // 1. Verify webhook signature
        const expectedSignature = crypto_1.default
            .createHmac("sha256", env_js_1.env.RAZORPAY_WEBHOOK_SECRET)
            .update(rawBody)
            .digest("hex");
        if (expectedSignature !== signature) {
            console.warn("[Webhook] Invalid signature verification failed");
            return res.status(400).json({ error: "Invalid signature" });
        }
        const event = req.body;
        console.log(`[Webhook] Received Razorpay event: ${event.event}`);
        const subEntity = event.payload?.subscription?.entity;
        if (!subEntity) {
            return res.status(200).json({ status: "ignored", message: "No subscription entity found" });
        }
        const subscriptionId = subEntity.id;
        const userId = subEntity.notes?.userId;
        const status = subEntity.status;
        // Find User by subscriptionId or fallback to userId from notes
        let user = await User_model_js_1.UserModel.findOne({ subscriptionId });
        if (!user && userId) {
            user = await User_model_js_1.UserModel.findById(userId);
        }
        if (!user) {
            console.error(`[Webhook] User not found for subscription ${subscriptionId} or userId ${userId}`);
            return res.status(404).json({ error: "User not found" });
        }
        // Update subscription details on User
        user.subscriptionId = subscriptionId;
        user.subscriptionStatus = status;
        const currentStart = subEntity.current_start || subEntity.start_at;
        const currentEnd = subEntity.current_end || subEntity.end_at;
        if (currentStart) {
            user.subscriptionStartDate = new Date(currentStart * 1000);
        }
        if (currentEnd) {
            user.subscriptionEndDate = new Date(currentEnd * 1000);
        }
        switch (event.event) {
            case "subscription.activated":
            case "subscription.charged":
                user.plan = "PRO";
                break;
            case "subscription.cancelled":
                user.plan = "FREE";
                user.subscriptionStatus = "cancelled";
                break;
            case "subscription.completed":
                user.plan = "FREE";
                user.subscriptionStatus = "completed";
                break;
            default:
                console.log(`[Webhook] Unhandled event type: ${event.event}`);
        }
        await user.save();
        console.log(`[Webhook] Successfully updated plan for user ${user._id} to ${user.plan}`);
        return res.status(200).json({ status: "success" });
    }
    catch (error) {
        console.error("[Webhook Controller] Error:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}
//# sourceMappingURL=webhook.controller.js.map