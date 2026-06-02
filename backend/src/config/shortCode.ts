/**
 * Short Code Configuration
 * ────────────────────────
 * Validates and exports the secret key used for obfuscating the Redis
 * auto-incrementing ID. Obfuscating this ID prevents URL enumeration and
 * makes short URLs appear random and professional.
 */

if (!process.env.SHORT_CODE_SECRET) {
  throw new Error("Missing environment variable: SHORT_CODE_SECRET must be defined.");
}

const secretVal = Number(process.env.SHORT_CODE_SECRET);

if (isNaN(secretVal) || !Number.isInteger(secretVal)) {
  throw new Error("Invalid environment variable: SHORT_CODE_SECRET must be a valid integer.");
}

export const SHORT_CODE_SECRET = secretVal;
