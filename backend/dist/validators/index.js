"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchema = exports.loginSchema = exports.createUrlSchema = void 0;
exports.validate = validate;
const zod_1 = require("zod");
/**
 * Zod Validation Schemas (Zod v4)
 * ──────────────────────────────
 * Centralized request validation using Zod.
 * Returns clean 400 errors with specific field-level messages.
 */
// ─── Schemas ─────────────────────────────────────────
exports.createUrlSchema = zod_1.z.object({
    url: zod_1.z
        .string({ error: "URL is required" })
        .min(1, "URL cannot be empty")
        .max(2048, "URL is too long (max 2048 characters)")
        .refine((val) => {
        try {
            // Accept URLs with or without protocol
            const urlToTest = /^https?:\/\//i.test(val) ? val : `https://${val}`;
            new URL(urlToTest);
            return true;
        }
        catch {
            return false;
        }
    }, { message: "Invalid URL format" }),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z
        .string({ error: "Email is required" })
        .email("Invalid email format"),
    password: zod_1.z
        .string({ error: "Password is required" })
        .min(1, "Password is required"),
});
exports.registerSchema = zod_1.z.object({
    name: zod_1.z
        .string({ error: "Name is required" })
        .min(1, "Name cannot be empty")
        .max(100, "Name is too long"),
    email: zod_1.z
        .string({ error: "Email is required" })
        .email("Invalid email format"),
    password: zod_1.z
        .string({ error: "Password is required" })
        .min(6, "Password must be at least 6 characters")
        .max(128, "Password is too long"),
});
// ─── Validation Middleware Factory ───────────────────
/**
 * Creates an Express middleware that validates req.body against a Zod schema.
 * Returns 400 with structured error messages on validation failure.
 */
function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const issues = result.error.issues || [];
            const errors = issues.map((e) => ({
                field: e.path?.join(".") || "unknown",
                message: e.message || "Validation error",
            }));
            res.status(400).json({
                error: "Validation failed",
                details: errors,
            });
            return;
        }
        // Replace req.body with parsed (and sanitized) data
        req.body = result.data;
        next();
    };
}
//# sourceMappingURL=index.js.map