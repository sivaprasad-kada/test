"use strict";
/**
 * Custom Base62 Encoder
 * ─────────────────────
 * Directly encodes non-negative integers into a Base62 string representation.
 * Avoids any intermediate string or Buffer conversions, keeping the operation
 * highly efficient (O(log_62(N)) time complexity and O(1) extra space).
 *
 * Alphabet: 0-9, a-z, A-Z (standard Base62)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeBase62 = encodeBase62;
const BASE62_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function encodeBase62(num) {
    if (num < 0 || !Number.isInteger(num)) {
        throw new Error("[Base62] Input must be a non-negative integer.");
    }
    if (num === 0) {
        return "0";
    }
    let result = "";
    let temp = num;
    while (temp > 0) {
        const remainder = temp % 62;
        result = BASE62_ALPHABET[remainder] + result;
        temp = Math.floor(temp / 62);
    }
    return result;
}
//# sourceMappingURL=base62.js.map