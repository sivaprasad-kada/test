import { Request, Response } from "express";
import Razorpay from "razorpay";
import { UserModel } from "../models/User.model.js";
import { env } from "../config/env.js";

// Initialize Razorpay SDK
const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

let cachedPlanId: string | null = null;

// Dynamically create or retrieve the Razorpay Pro Plan ID
async function getOrCreatePlanId(): Promise<string> {
  if (cachedPlanId) return cachedPlanId;

  try {
    const plans = await razorpay.plans.all();
    const existingPlan = plans.items.find(
      (p: any) =>
        p.item.name === "Pro Plan" &&
        p.item.amount === env.PRO_MONTHLY_PRICE * 100 &&
        p.period === "monthly"
    );
    if (existingPlan) {
      cachedPlanId = existingPlan.id;
      return cachedPlanId;
    }
  } catch (err: any) {
    console.error("[Razorpay] Failed to fetch plans, attempting to create one:", err.message);
  }

  const plan = await razorpay.plans.create({
    period: "monthly",
    interval: 1,
    item: {
      name: "Pro Plan",
      amount: env.PRO_MONTHLY_PRICE * 100,
      currency: "INR",
      description: "Distributed URL Shortener Pro Plan",
    },
  });

  cachedPlanId = plan.id;
  return cachedPlanId;
}

export async function createSubscription(req: Request, res: Response): Promise<any> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // If user is already on PRO and subscription status is active, return it
    if (user.plan === "PRO" && user.subscriptionStatus === "active" && user.subscriptionId) {
      return res.json({
        message: "Already subscribed to Pro",
        subscriptionId: user.subscriptionId,
        status: user.subscriptionStatus,
        keyId: env.RAZORPAY_KEY_ID,
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
      keyId: env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("[Billing Controller] Create Subscription Error:", error);
    const detailMessage = error.error?.description || error.description || error.message || "Failed to create subscription";
    return res.status(500).json({ error: detailMessage });
  }
}
