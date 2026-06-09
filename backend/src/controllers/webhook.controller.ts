import { Request, Response } from "express";
import crypto from "crypto";
import { UserModel } from "../models/User.model.js";
import { env } from "../config/env.js";

export async function razorpayWebhookHandler(req: Request, res: Response): Promise<any> {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    if (!signature) {
      console.warn("[Webhook] Missing x-razorpay-signature header");
      return res.status(400).json({ error: "Missing signature" });
    }

    // 1. Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
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
    let user = await UserModel.findOne({ subscriptionId });
    if (!user && userId) {
      user = await UserModel.findById(userId);
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
  } catch (error: any) {
    console.error("[Webhook Controller] Error:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
