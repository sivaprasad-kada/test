import { Router } from "express";
import {
    createShortUrlHandler,
    updateUrlHandler,
    deleteUrlHandler,
    getUserUrlsHandler,
    getAnalyticsHandler,
} from "../controllers/url.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

/**
 * URL Management Routes
 * ─────────────────────
 * CRUD operations for short URLs.
 *
 * POST   /api/url           — Create a new short URL
 * PUT    /api/url/:shortId  — Update destination URL (+ cache invalidation)
 * DELETE /api/url/:shortId  — Delete a URL mapping (+ cache invalidation)
 */

const router = Router();
router.use(requireAuth);

router.get("/", getUserUrlsHandler);
router.post("/", createShortUrlHandler);
router.get("/:shortId/analytics", getAnalyticsHandler);
router.put("/:shortId", updateUrlHandler);
router.delete("/:shortId", deleteUrlHandler);

export default router;