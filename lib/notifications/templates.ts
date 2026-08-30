import {
  FAILED_EMAIL_SUBJECT,
  INVITE_EMAIL_SUBJECT,
  READY_EMAIL_BUTTON,
  READY_EMAIL_SUBJECT,
  RECEIPT_EMAIL_SUBJECT,
  RESET_EMAIL_SUBJECT,
  SUPPORT_RECEIVED_SUBJECT,
  SUPPORT_REPLY_SUBJECT,
  SUPPORT_STAFF_SUBJECT,
  EXISTING_ACCOUNT_SUBJECT,
  VERIFY_EMAIL_SUBJECT,
  WELCOME_EMAIL_SUBJECT,
} from "./copy";
import { renderEmailHtml } from "./email-layout";
import type { EmailQueueMessage } from "./messages";

export type RenderedEmail = {
  subject: string;
  text: string;
  html: string;
};

export function renderEmail(message: EmailQueueMessage): RenderedEmail {
  const action = absoluteAction(message.appUrl, message.actionUrl);
  const name = message.firstName?.trim() || "there";
  switch (message.template) {
    case "welcome":
      return envelope({
        appUrl: message.appUrl,
        subject: WELCOME_EMAIL_SUBJECT,
        heading: "Welcome to Production30",
        body: `Hi ${name}. Your account is ready. Open your studio to brief your first commercial.`,
        actionUrl: action,
        button: "Open my studio",
      });
    case "verify-email":
      return envelope({
        appUrl: message.appUrl,
        subject: VERIFY_EMAIL_SUBJECT,
        heading: "Confirm your email",
        body: "Tap the button to confirm this email for your Production30 account. You cannot sign in until you do.",
        actionUrl: action,
        button: "Confirm my email",
      });
    case "existing-account":
      return envelope({
        appUrl: message.appUrl,
        subject: EXISTING_ACCOUNT_SUBJECT,
        heading: "You already have an account",
        body: "This email is already registered. Sign in to open your studio. If you forgot your password, use Forgot password on the sign-in page.",
        actionUrl: action,
        button: "Sign in",
      });
    case "reset-password":
      return envelope({
        appUrl: message.appUrl,
        subject: RESET_EMAIL_SUBJECT,
        heading: "Reset your password",
        body: "Tap the button to choose a new password. If you did not ask for this, you can ignore the email.",
        actionUrl: action,
        button: "Reset password",
      });
    case "commercial-ready":
      return envelope({
        appUrl: message.appUrl,
        subject: READY_EMAIL_SUBJECT,
        heading: READY_EMAIL_SUBJECT,
        body: message.body ?? "Your Production30 commercial is ready to watch in your studio.",
        actionUrl: action,
        button: message.buttonLabel ?? READY_EMAIL_BUTTON,
      });
    case "commercial-failed":
      return envelope({
        appUrl: message.appUrl,
        subject: FAILED_EMAIL_SUBJECT,
        heading: FAILED_EMAIL_SUBJECT,
        body: message.body ?? "We couldn't complete this commercial. Your Ad Credit has not been lost.",
        actionUrl: action,
        button: "View production",
      });
    case "payment-receipt":
      return envelope({
        appUrl: message.appUrl,
        subject: RECEIPT_EMAIL_SUBJECT,
        heading: RECEIPT_EMAIL_SUBJECT,
        body: message.body ?? "Your payment was received and your Ad Credits are in your studio.",
        actionUrl: action,
        button: "View billing",
      });
    case "team-invite":
      return envelope({
        appUrl: message.appUrl,
        subject: INVITE_EMAIL_SUBJECT,
        heading: INVITE_EMAIL_SUBJECT,
        body: message.body ?? "You've been invited to a Production30 studio.",
        actionUrl: action,
        button: "Open invitation",
      });
    case "support-staff":
      return envelope({
        appUrl: message.appUrl,
        subject: SUPPORT_STAFF_SUBJECT,
        heading: SUPPORT_STAFF_SUBJECT,
        body: message.body ?? "A customer sent a support message.",
        actionUrl: action,
        button: "Open Admin Support",
      });
    case "support-received":
      return envelope({
        appUrl: message.appUrl,
        subject: SUPPORT_RECEIVED_SUBJECT,
        heading: SUPPORT_RECEIVED_SUBJECT,
        body: message.body ?? "Thanks. We received your message. We'll email you back.",
        actionUrl: action,
        button: message.buttonLabel ?? "Open Help",
      });
    case "support-reply":
      return envelope({
        appUrl: message.appUrl,
        subject: SUPPORT_REPLY_SUBJECT,
        heading: SUPPORT_REPLY_SUBJECT,
        body: message.body ?? "We sent a reply to your Production30 message.",
        actionUrl: action,
        button: "Read the reply",
      });
  }
}

function absoluteAction(appUrl: string, actionUrl?: string): string {
  const base = appUrl.replace(/\/$/, "");
  if (!actionUrl) {
    return `${base}/dashboard`;
  }
  if (actionUrl.startsWith("http://") || actionUrl.startsWith("https://")) {
    return actionUrl;
  }
  return `${base}${actionUrl.startsWith("/") ? actionUrl : `/${actionUrl}`}`;
}

function envelope(input: {
  appUrl: string;
  subject: string;
  heading: string;
  body: string;
  actionUrl: string;
  button: string;
}): RenderedEmail {
  const text = `${input.heading}\n\n${input.body}\n\n${input.button}:\n${input.actionUrl}`;
  return {
    subject: input.subject,
    text,
    html: renderEmailHtml(input),
  };
}
