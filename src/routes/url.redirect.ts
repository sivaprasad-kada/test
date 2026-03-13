import express from "express";
import { redirectUrl } from "../controllers/url.redirect.controller.js";

const router = express.Router();

router.get("/:shortId", redirectUrl);

export default router;