import { Router } from "express";
import {
  register,
  login,
  logout,
  getMe,
  googleAuth,
  googleAuthCallback,
  githubAuth,
  githubAuthCallback,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { authLimiter } from "../middlewares/rateLimiter.middleware.js";
import { validate, loginSchema, registerSchema } from "../validators/index.js";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, getMe);

router.get("/google", googleAuth);
router.get("/google/callback", googleAuthCallback);

router.get("/github", githubAuth);
router.get("/github/callback", githubAuthCallback);

export default router;
