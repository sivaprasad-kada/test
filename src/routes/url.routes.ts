import { Router } from "express";
import {
    createShortUrlHandler,
    updateUrlHandler,
    deleteUrlHandler,
} from "../controllers/url.controller.js";

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

router.post("/", createShortUrlHandler);
router.put("/:shortId", updateUrlHandler);
router.delete("/:shortId", deleteUrlHandler);

export default router;