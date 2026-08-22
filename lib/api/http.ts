import { NextResponse } from "next/server";
import { CreditError } from "@/lib/credits/errors";
import { AuthzError } from "@/lib/authz/errors";
import { PaymentError } from "@/lib/providers/payments";
import { ProductionError } from "@/lib/production/errors";
import { ObjectKeyError } from "@/lib/r2/keys";
import { RateLimitError } from "@/lib/security/errors";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function fromCaught(error: unknown) {
  if (error instanceof RateLimitError) {
    return jsonError(error.message, 429);
  }
  if (error instanceof AuthzError) {
    if (error.code === "UNAUTHENTICATED") {
      return jsonError("Sign in required.", 401);
    }
    return jsonError("Not found.", 404);
  }
  if (error instanceof CreditError) {
    return jsonError(error.message, error.code === "NOT_FOUND" ? 404 : 400);
  }
  if (error instanceof ProductionError) {
    return jsonError(error.message, error.code === "NO_CREDITS" || error.code === "DUPLICATE" ? 409 : 400);
  }
  if (error instanceof PaymentError) {
    if (error.code === "INVALID_SIGNATURE") {
      return jsonError("We couldn't confirm that payment event.", 400);
    }
    if (error.code === "NOT_CONNECTED") {
      return jsonError(error.message, 503);
    }
    return jsonError(error.message, 400);
  }
  if (error instanceof ObjectKeyError) {
    return jsonError(error.message, 400);
  }
  if (error instanceof Error && error.message) {
    return jsonError(error.message, 400);
  }
  return jsonError("We couldn't complete that.", 400);
}

export function fromAdminCaught(error: unknown) {
  if (error instanceof AuthzError) {
    if (error.code === "UNAUTHENTICATED") {
      return jsonError("Sign in required.", 401);
    }
    if (error.code === "FORBIDDEN") {
      return jsonError("Staff only.", 403);
    }
    return jsonError("Not found.", 404);
  }
  return fromCaught(error);
}
