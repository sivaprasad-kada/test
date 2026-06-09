import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  RAZORPAY_KEY_ID: z.string().min(1, "RAZORPAY_KEY_ID is required"),
  RAZORPAY_KEY_SECRET: z.string().min(1, "RAZORPAY_KEY_SECRET is required"),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1, "RAZORPAY_WEBHOOK_SECRET is required"),
  FREE_MAX_LINKS: z.coerce.number().default(500),
  FREE_MAX_REDIRECTS: z.coerce.number().default(5000),
  PRO_MAX_LINKS: z.coerce.number().default(2000),
  PRO_MAX_REDIRECTS: z.coerce.number().default(200000),
  PRO_MONTHLY_PRICE: z.coerce.number().default(299),
  FRONTEND_URL: z.string().optional(),
  BACKEND_URL: z.string().optional(),
});

let envParsed: z.infer<typeof envSchema>;

try {
  envParsed = envSchema.parse(process.env);
} catch (error: any) {
  console.error("❌ Invalid environment variables:");
  if (error instanceof z.ZodError) {
    error.issues.forEach((err: any) => {
      console.error(`   - ${err.path.join(".")}: ${err.message}`);
    });
  } else {
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

export const env = {
  ...envParsed,
  isProduction: isProd,
  FRONTEND_URL,
  BACKEND_URL,
  GOOGLE_CALLBACK_URL,
  GITHUB_CALLBACK_URL,
};
