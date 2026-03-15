import express from "express";
import urlRoutes from "./routes/url.routes.js";
import redirectRoutes from "./routes/redirect.routes.js";

/**
 * Express Application
 * ───────────────────
 * Configures middleware and routes.
 *
 * IMPORTANT: The redirect route (/:shortId) MUST be registered
 * LAST because it's a catch-all parameterized route. If registered
 * first, it would intercept /api/url and /health requests.
 */
console.log("app.js file is running : just for learning purpose 😁")
const app = express();

// ─── Middleware ───────────────────────────────────────

// Trust proxy headers (x-forwarded-for) for correct IP extraction
app.set("trust proxy", true);

app.use(express.json());

// ─── Health Check ────────────────────────────────────

app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── API Routes ──────────────────────────────────────

app.use("/api/url", urlRoutes);

// ─── Redirect Route (MUST be last) ──────────────────

app.use("/", redirectRoutes);

export default app;