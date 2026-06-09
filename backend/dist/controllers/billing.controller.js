"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubscription = createSubscription;
const razorpay_1 = __importDefault(require("razorpay"));
const User_model_js_1 = require("../models/User.model.js");
const env_js_1 = require("../config/env.js");
// Initialize Razorpay SDK
const razorpay = new razorpay_1.default({
    key_id: env_js_1.env.RAZORPAY_KEY_ID,
    key_secret: env_js_1.env.RAZORPAY_KEY_SECRET,
});
let cachedPlanId = null;
// Dynamically create or retrieve the Razorpay Pro Plan ID
async function getOrCreatePlanId() {
    if (cachedPlanId)
        return cachedPlanId;
    try {
        const plans = await razorpay.plans.all();
        const existingPlan = plans.items.find((p) => p.item.name === "Pro Plan" &&
            p.item.amount === env_js_1.env.PRO_MONTHLY_PRICE * 100 &&
            p.period === "monthly");
        if (existingPlan) {
            cachedPlanId = existingPlan.id;
            return cachedPlanId;
        }
    }
    catch (err) {
        console.error("[Razorpay] Failed to fetch plans, attempting to create one:", err.message);
    }
    const plan = await razorpay.plans.create({
        period: "monthly",
        interval: 1,
        item: {
            name: "Pro Plan",
            amount: env_js_1.env.PRO_MONTHLY_PRICE * 100,
            currency: "INR",
            description: "Distributed URL Shortener Pro Plan",
        },
    });
    cachedPlanId = plan.id;
    return cachedPlanId;
}
async function createSubscription(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const user = await User_model_js_1.UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        // If user is already on PRO and subscription status is active, return it
        if (user.plan === "PRO" && user.subscriptionStatus === "active" && user.subscriptionId) {
            return res.json({
                message: "Already subscribed to Pro",
                subscriptionId: user.subscriptionId,
                status: user.subscriptionStatus,
                keyId: env_js_1.env.RAZORPAY_KEY_ID,
            });
        }
        const planId = await getOrCreatePlanId();
        const subscription = await razorpay.subscriptions.create({
            plan_id: planId,
            customer_notify: 1,
            total_count: 120, // 10 years recurring
            notes: {
                userId: userId,
            },
        });
        // Update user subscription metadata
        user.subscriptionId = subscription.id;
        user.subscriptionStatus = subscription.status;
        await user.save();
        return res.status(201).json({
            subscriptionId: subscription.id,
            status: subscription.status,
            keyId: env_js_1.env.RAZORPAY_KEY_ID,
        });
    }
    catch (error) {
        console.error("[Billing Controller] Create Subscription Error:", error);
        const detailMessage = error.error?.description || error.description || error.message || "Failed to create subscription";
        return res.status(500).json({ error: detailMessage });
    }
}
//# sourceMappingURL=billing.controller.js.map