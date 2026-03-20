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

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, getMe);

router.get("/google", googleAuth);
router.get("/google/callback", googleAuthCallback);

router.get("/github", githubAuth);
router.get("/github/callback", githubAuthCallback);

export default router;
