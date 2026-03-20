import express from "express";
import cors from "cors";
import urlRoutes from "./routes/url.routes.js";
import redirectRoutes from "./routes/redirect.routes.js";
import authRoutes from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";

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

// CORS — allow frontend to send cookies cross-origin
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:8080",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:5173",
];

app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// ─── Health Check ────────────────────────────────────

app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── API Routes ──────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/url", urlRoutes);

// ─── Redirect Route (MUST be last) ──────────────────

app.use("/", redirectRoutes);

export default app;