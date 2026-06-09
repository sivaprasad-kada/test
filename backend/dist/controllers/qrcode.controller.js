"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQrCodeHandler = generateQrCodeHandler;
const qrcode_1 = __importDefault(require("qrcode"));
const Url_model_js_1 = require("../models/Url.model.js");
const User_model_js_1 = require("../models/User.model.js");
async function generateQrCodeHandler(req, res) {
    try {
        const id = req.params.id;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // 1. Fetch URL document by ID (or fallback to shortId if ID is not a valid ObjectId)
        let urlDoc = await Url_model_js_1.UrlModel.findOne({
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
        const user = await User_model_js_1.UserModel.findById(userId);
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
        await qrcode_1.default.toFileStream(res, qrContent, {
            width: 300,
            margin: 2,
            color: {
                dark: "#0F172A", // Slate 900
                light: "#FFFFFF"
            }
        });
    }
    catch (error) {
        console.error("[QR Code Controller] Generation error:", error.message);
        if (!res.headersSent) {
            return res.status(500).json({ error: "Failed to generate QR Code" });
        }
    }
}
//# sourceMappingURL=qrcode.controller.js.map