import { Request, Response } from "express";
import { UrlModel } from "../models/Url.model.js";

const RESERVED_ALIASES = new Set([
  "login",
  "signup",
  "admin",
  "dashboard",
  "api",
  "billing",
  "pricing",
  "health",
]);

export async function checkAliasAvailability(req: Request, res: Response): Promise<any> {
  try {
    const alias = (req.params.alias as string)?.trim().toLowerCase();

    if (!alias) {
      return res.status(400).json({ error: "Alias parameter is required" });
    }

    // 1. Regex validation
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(alias)) {
      return res.json({ available: false });
    }

    // 2. Reserved Keyword check
    if (RESERVED_ALIASES.has(alias)) {
      return res.json({ available: false });
    }

    // 3. Database check
    const existing = await UrlModel.findOne({ shortId: alias }).select("_id").lean();
    if (existing) {
      return res.json({ available: false });
    }

    return res.json({ available: true });
  } catch (error: any) {
    console.error("[Alias Controller] Check availability error:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
