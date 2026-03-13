import { Request, Response } from "express";
import { getLongUrl } from "../services/url.service.js";

export const redirectUrl = async (req: Request, res: Response) => {
  try {
    const shortId = req.params.shortId as string;

    const longUrl = await getLongUrl(shortId);

    if (!longUrl) {
      return res.status(404).json({ message: "URL not found" });
    }

    return res.redirect(302, longUrl);

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};