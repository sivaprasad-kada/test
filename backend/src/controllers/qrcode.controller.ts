import { Request, Response } from "express";
import QRCode from "qrcode";
import { UrlModel } from "../models/Url.model.js";
import { UserModel } from "../models/User.model.js";

export async function generateQrCodeHandler(req: Request, res: Response): Promise<any> {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 1. Fetch URL document by ID (or fallback to shortId if ID is not a valid ObjectId)
    let urlDoc = await UrlModel.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { shortId: id }
      ].filter(cond => cond !== null)
    });

    if (!urlDoc) {
      return res.status(404).json({ error: "URL not found" });
    }

    // 2. Verify ownership
    if (urlDoc.userId.toString() !== userId) {
      return res.status(403).json({ error: "Unauthorized access to this URL" });
    }

    // 3. Verify PRO plan
    const user = await UserModel.findById(userId);
    if (!user || user.plan !== "PRO") {
      return res.status(403).json({
        error: "Feature restricted",
        message: "QR Code generation is only available in the PRO plan.",
      });
    }

    // 4. Generate URL to encode
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const qrContent = `${baseUrl}/${urlDoc.shortId}`;

    // 5. Generate and return image stream
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `inline; filename="qr-${urlDoc.shortId}.png"`);
    
    await QRCode.toFileStream(res, qrContent, {
      width: 300,
      margin: 2,
      color: {
        dark: "#0F172A", // Slate 900
        light: "#FFFFFF"
      }
    });
  } catch (error: any) {
    console.error("[QR Code Controller] Generation error:", error.message);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to generate QR Code" });
    }
  }
}
