"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "production", "test"]).default("development"),
    PORT: zod_1.z.coerce.number().default(5000),
    MONGO_URI: zod_1.z.string().min(1, "MONGO_URI is required"),
    REDIS_URL: zod_1.z.string().default("redis://localhost:6379"),
    JWT_SECRET: zod_1.z.string().min(1, "JWT_SECRET is required"),
    RAZORPAY_KEY_ID: zod_1.z.string().min(1, "RAZORPAY_KEY_ID is required"),
    RAZORPAY_KEY_SECRET: zod_1.z.string().min(1, "RAZORPAY_KEY_SECRET is required"),
    RAZORPAY_WEBHOOK_SECRET: zod_1.z.string().min(1, "RAZORPAY_WEBHOOK_SECRET is required"),
    FREE_MAX_LINKS: zod_1.z.coerce.number().default(500),
    FREE_MAX_REDIRECTS: zod_1.z.coerce.number().default(5000),
    PRO_MAX_LINKS: zod_1.z.coerce.number().default(2000),
    PRO_MAX_REDIRECTS: zod_1.z.coerce.number().default(200000),
    PRO_MONTHLY_PRICE: zod_1.z.coerce.number().default(299),
    FRONTEND_URL: zod_1.z.string().optional(),
    BACKEND_URL: zod_1.z.string().optional(),
});
let envParsed;
try {
    envParsed = envSchema.parse(process.env);
}
catch (error) {
    console.error("❌ Invalid environment variables:");
    if (error instanceof zod_1.z.ZodError) {
        error.issues.forEach((err) => {
            console.error(`   - ${err.path.join(".")}: ${err.message}`);
        });
    }
    else {
        console.error(error);
    }
    process.exit(1);
}
const isProd = envParsed.NODE_ENV === "production";
const FRONTEND_URL = isProd
    ? "https://shortly.sivaprasadkada.tech"
    : (envParsed.FRONTEND_URL || "http://localhost:8080");
const BACKEND_URL = isProd
    ? "https://api.shortly.sivaprasadkada.tech"
    : (envParsed.BACKEND_URL || `http://localhost:${envParsed.PORT}`);
const GOOGLE_CALLBACK_URL = `${BACKEND_URL}/api/auth/google/callback`;
const GITHUB_CALLBACK_URL = `${BACKEND_URL}/api/auth/github/callback`;
exports.env = {
    ...envParsed,
    isProduction: isProd,
    FRONTEND_URL,
    BACKEND_URL,
    GOOGLE_CALLBACK_URL,
    GITHUB_CALLBACK_URL,
};
//# sourceMappingURL=env.js.map