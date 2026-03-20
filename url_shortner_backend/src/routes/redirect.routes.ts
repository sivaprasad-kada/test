import { Router } from "express";
import { redirectUrl } from "../controllers/redirect.controller.js";

/**
 * Redirect Routes
 * ───────────────
 * GET /:shortId — resolves and redirects to the original URL.
 *
 * This route MUST be registered LAST in the Express app
 * so it doesn't catch other routes like /api/* or /health.
 */

const router = Router();

router.get("/:shortId", redirectUrl);

export default router;
