import { createHmac, timingSafeEqual } from "node:crypto";

export const PAYSTACK_SIGNATURE_HEADER = "x-paystack-signature";

/**
 * Paystack signs the raw request body with HMAC-SHA512 using the secret key
 * and sends the hex digest in `x-paystack-signature`.
 * Hash the bytes we received — do not `JSON.stringify` a parsed object.
 */
export function verifyPaystackSignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string,
): boolean {
  if (!signature || !secret) {
    return false;
  }
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const provided = signature.trim().toLowerCase();
  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(provided, "utf8");
  if (expectedBuf.length !== providedBuf.length) {
    return false;
  }
  return timingSafeEqual(expectedBuf, providedBuf);
}

export function signPaystackBody(rawBody: string, secret: string): string {
  return createHmac("sha512", secret).update(rawBody).digest("hex");
}
