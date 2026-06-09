import { z } from "zod";
import { Request, Response, NextFunction } from "express";

/**
 * Zod Validation Schemas (Zod v4)
 * ──────────────────────────────
 * Centralized request validation using Zod.
 * Returns clean 400 errors with specific field-level messages.
 */

// ─── Schemas ─────────────────────────────────────────

export const createUrlSchema = z.object({
    url: z
        .string({ error: "URL is required" })
        .min(1, "URL cannot be empty")
        .max(2048, "URL is too long (max 2048 characters)")
        .refine(
            (val) => {
                try {
                    // Accept URLs with or without protocol
                    const urlToTest = /^https?:\/\//i.test(val) ? val : `https://${val}`;
                    new URL(urlToTest);
                    return true;
                } catch {
                    return false;
                }
            },
            { message: "Invalid URL format" }
        ),
    customAlias: z
        .string()
        .min(3, "Alias must be at least 3 characters")
        .max(30, "Alias must be at most 30 characters")
        .regex(/^[a-zA-Z0-9_-]+$/, "Alias must contain only alphanumeric characters, hyphens or underscores")
        .optional()
        .or(z.literal("")),
});

export const loginSchema = z.object({
    email: z
        .string({ error: "Email is required" })
        .email("Invalid email format"),
    password: z
        .string({ error: "Password is required" })
        .min(1, "Password is required"),
});

export const registerSchema = z.object({
    name: z
        .string({ error: "Name is required" })
        .min(1, "Name cannot be empty")
        .max(100, "Name is too long"),
    email: z
        .string({ error: "Email is required" })
        .email("Invalid email format"),
    password: z
        .string({ error: "Password is required" })
        .min(6, "Password must be at least 6 characters")
        .max(128, "Password is too long"),
});

// ─── Validation Middleware Factory ───────────────────

/**
 * Creates an Express middleware that validates req.body against a Zod schema.
 * Returns 400 with structured error messages on validation failure.
 */
export function validate(schema: z.ZodType) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const issues = result.error.issues || [];
            const errors = issues.map((e: any) => ({
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
