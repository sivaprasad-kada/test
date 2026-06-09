import { Router } from "express";
import { checkAliasAvailability } from "../controllers/alias.controller.js";
import { apiLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = Router();

// Expose alias check endpoint (unauthenticated or authenticated; public check is useful on frontend form)
router.get("/check/:alias", apiLimiter, checkAliasAvailability);

export default router;
