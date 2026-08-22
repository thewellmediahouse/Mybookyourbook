export const NO_PRODUCTION_CREDITS =
  "You need 1 Ad Credit to film this commercial. Buy credits from Billing.";
export const GENERATION_DESCRIPTION = "Filming your commercial";
export const TECHNICAL_REFUND_DESCRIPTION =
  "This Ad Credit was returned because production could not be completed.";
export const CREDIT_RETURNED = "We couldn't complete this production. Your Ad Credit has not been lost.";

export function generationIdempotencyKey(projectId: string, attemptId: string): string {
  return `generation:${projectId}:${attemptId}`;
}

export function technicalRefundIdempotencyKey(generationKey: string): string {
  return `technical-refund:${generationKey}`;
}

export function creditTypeLabel(type: string): string {
  if (type === "GENERATION") {
    return "Filming your commercial";
  }
  if (type === "TECHNICAL_REFUND") {
    return "Ad Credit returned";
  }
  if (type === "PURCHASE") {
    return "Credits purchased";
  }
  if (type === "SUBSCRIPTION_GRANT") {
    return "Plan credits";
  }
  if (type === "PROMOTION") {
    return "Complimentary credits";
  }
  if (type === "ADMIN_ADJUSTMENT") {
    return "Credit adjustment";
  }
  if (type === "EXPIRY") {
    return "Credits expired";
  }
  return type;
}

export function produceHoldReason(credits: number, filmingUnavailable: string): string {
  if (credits < 1) {
    return NO_PRODUCTION_CREDITS;
  }
  return filmingUnavailable;
}
