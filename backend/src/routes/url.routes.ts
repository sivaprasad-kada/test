import { Router } from "express";
import {
    createShortUrlHandler,
    updateUrlHandler,
    deleteUrlHandler,
    getUserUrlsHandler,
    getAnalyticsHandler,
} from "../controllers/url.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { checkLinkLimit } from "../middlewares/plan.middleware.js";
import { apiLimiter } from "../middlewares/rateLimiter.middleware.js";
import { validate, createUrlSchema } from "../validators/index.js";

/**
 * URL Management Routes
 * ─────────────────────
 * CRUD operations for short URLs.
 *
 * POST   /api/url           — Create a new short URL
 * GET    /api/url            — Get all user URLs
 * GET    /api/url/:shortId/analytics — Get analytics for a URL
 * PUT    /api/url/:shortId  — Update destination URL (+ cache invalidation)
 * DELETE /api/url/:shortId  — Delete a URL mapping (+ cache invalidation)
 */

const router = Router();
router.use(requireAuth);
router.use(apiLimiter);

router.get("/", getUserUrlsHandler);
router.post("/", checkLinkLimit, validate(createUrlSchema), createShortUrlHandler);
router.get("/:shortId/analytics", getAnalyticsHandler);
router.put("/:shortId", validate(createUrlSchema), updateUrlHandler);
router.delete("/:shortId", deleteUrlHandler);

export default router;