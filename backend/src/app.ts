import express from "express";
import cors from "cors";
import helmet from "helmet";
import urlRoutes from "./routes/url.routes.js";
import redirectRoutes from "./routes/redirect.routes.js";
import authRoutes from "./routes/auth.routes.js";
import aliasRoutes from "./routes/alias.routes.js";
import linksRoutes from "./routes/links.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";


/**
 * Express Application
 * ───────────────────
 * Configures middleware and routes.
 *
 * IMPORTANT: The redirect route (/:shortId) MUST be registered
 * LAST because it's a catch-all parameterized route. If registered
 * first, it would intercept /api/url and /health requests.
 */

const app = express();

// ─── Security Headers ────────────────────────────────
// Helmet adds essential security headers (X-Content-Type-Options,
// X-Frame-Options, HSTS, etc.) with minimal configuration.
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disabled for development flexibility
}));

// ─── Middleware ───────────────────────────────────────

// Trust proxy headers (x-forwarded-for) for correct IP extraction in production
if (env.isProduction) {
  app.set("trust proxy", true);
}

// CORS — allow frontend to send cookies cross-origin
const rawFrontendUrl = env.FRONTEND_URL;
const sanitizedFrontendUrl = rawFrontendUrl.replace(/\/$/, "");

const allowedOrigins = [
  rawFrontendUrl,
  sanitizedFrontendUrl,
  "https://shortly.sivaprasadkada.tech",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:5173",
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || !env.isProduction) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(cookieParser());

// ─── Health Check ────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── API Routes ──────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/url", urlRoutes);
app.use("/api/alias", aliasRoutes);
app.use("/api/links", linksRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/webhooks", webhookRoutes);

// ─── Redirect Route (MUST be last) ──────────────────

app.use("/", redirectRoutes);

export default app;