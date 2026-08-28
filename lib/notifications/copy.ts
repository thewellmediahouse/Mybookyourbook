export const READY_EMAIL_SUBJECT = "Your Production30 commercial is ready";
export const READY_EMAIL_BUTTON = "View My Commercial";
export const FAILED_EMAIL_SUBJECT = "We couldn't finish your Production30 commercial";
export const WELCOME_EMAIL_SUBJECT = "Welcome to Production30";
export const VERIFY_EMAIL_SUBJECT = "Confirm your Production30 email";
export const EXISTING_ACCOUNT_SUBJECT = "You already have a Production30 account";
export const RESET_EMAIL_SUBJECT = "Reset your Production30 password";
export const RECEIPT_EMAIL_SUBJECT = "Your Production30 payment receipt";
export const INVITE_EMAIL_SUBJECT = "You're invited to a Production30 studio";
export const SUPPORT_STAFF_SUBJECT = "New Production30 support message";
export const SUPPORT_RECEIVED_SUBJECT = "We received your Production30 message";
export const SUPPORT_REPLY_SUBJECT = "A reply from Production30";
export const CREDIT_REFUNDED_TITLE = "Your Ad Credit was returned";
export const CREDIT_REFUNDED_BODY =
  "We couldn't complete that commercial, so your Ad Credit is back in your studio.";
export const VIEW_MY_COMMERCIAL = "View My Commercial";

export function commercialReadyEventKey(jobId: string, userId: string): string {
  return `production-ready/${jobId}/${userId}`;
}

export function commercialFailedEventKey(jobId: string, userId: string): string {
  return `production-failed/${jobId}/${userId}`;
}

export function creditRefundedEventKey(jobId: string, userId: string): string {
  return `credit-refunded/${jobId}/${userId}`;
}

export function paymentReceiptEventKey(paymentId: string, userId: string): string {
  return `payment-receipt/${paymentId}/${userId}`;
}

export function welcomeEventKey(userId: string): string {
  return `welcome/${userId}`;
}

export function existingAccountEventKey(userId: string): string {
  return `existing-account/${userId}`;
}

export function verifyEmailEventKey(url: string): string {
  return `verify-email/${tokenFingerprint(url)}`;
}

export function resetPasswordEventKey(url: string): string {
  return `reset-password/${tokenFingerprint(url)}`;
}

export function teamInviteEventKey(invitationId: string, attempt = "1"): string {
  return `team-invite/${invitationId}/${attempt}`;
}

export function supportStaffEventKey(ticketId: string, staffEmail: string): string {
  return `support-staff/${ticketId}/${staffEmail}`;
}

export function supportReceivedEventKey(ticketId: string): string {
  return `support-received/${ticketId}`;
}

export function supportReplyEventKey(replyId: string, recipient: string): string {
  return `support-reply/${replyId}/${recipient}`;
}

function tokenFingerprint(url: string): string {
  try {
    const parsed = new URL(url);
    const raw = parsed.searchParams.get("token") ?? parsed.pathname.split("/").filter(Boolean).at(-1) ?? url;
    // Better Auth verification tokens are JWTs. The header is identical, so the
    // first 80 characters collide across users. Uniqueness is at the end.
    return raw.length <= 96 ? raw : raw.slice(-96);
  } catch {
    return url.slice(-96) || "link";
  }
}
