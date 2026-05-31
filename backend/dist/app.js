"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const url_routes_js_1 = __importDefault(require("./routes/url.routes.js"));
const redirect_routes_js_1 = __importDefault(require("./routes/redirect.routes.js"));
const auth_routes_js_1 = __importDefault(require("./routes/auth.routes.js"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
/**
 * Express Application
 * ───────────────────
 * Configures middleware and routes.
 *
 * IMPORTANT: The redirect route (/:shortId) MUST be registered
 * LAST because it's a catch-all parameterized route. If registered
 * first, it would intercept /api/url and /health requests.
 */
const app = (0, express_1.default)();
// ─── Security Headers ────────────────────────────────
// Helmet adds essential security headers (X-Content-Type-Options,
// X-Frame-Options, HSTS, etc.) with minimal configuration.
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Disabled for development flexibility
}));
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
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== "production") {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// ─── Health Check ────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// ─── API Routes ──────────────────────────────────────
app.use("/api/auth", auth_routes_js_1.default);
app.use("/api/url", url_routes_js_1.default);
// ─── Redirect Route (MUST be last) ──────────────────
app.use("/", redirect_routes_js_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map