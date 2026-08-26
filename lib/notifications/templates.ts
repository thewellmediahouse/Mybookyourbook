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
  VERIFY_EMAIL_SUBJECT,
  WELCOME_EMAIL_SUBJECT,
} from "./copy";
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
        subject: WELCOME_EMAIL_SUBJECT,
        heading: "Welcome to Production30",
        body: `Hi ${name}. Your account is ready. Open your studio to brief your first commercial.`,
        actionUrl: action,
        button: "Open my studio",
      });
    case "verify-email":
      return envelope({
        subject: VERIFY_EMAIL_SUBJECT,
        heading: "Confirm your email",
        body: "Tap the button to verify this email for your Production30 account.",
        actionUrl: action,
        button: "Verify email",
      });
    case "reset-password":
      return envelope({
        subject: RESET_EMAIL_SUBJECT,
        heading: "Reset your password",
        body: "Tap the button to choose a new password. If you did not ask for this, you can ignore the email.",
        actionUrl: action,
        button: "Reset password",
      });
    case "commercial-ready":
      return envelope({
        subject: READY_EMAIL_SUBJECT,
        heading: READY_EMAIL_SUBJECT,
        body: message.body ?? "Your Production30 commercial is ready to watch in your studio.",
        actionUrl: action,
        button: message.buttonLabel ?? READY_EMAIL_BUTTON,
      });
    case "commercial-failed":
      return envelope({
        subject: FAILED_EMAIL_SUBJECT,
        heading: FAILED_EMAIL_SUBJECT,
        body: message.body ?? "We couldn't complete this commercial. Your Ad Credit has not been lost.",
        actionUrl: action,
        button: "View production",
      });
    case "payment-receipt":
      return envelope({
        subject: RECEIPT_EMAIL_SUBJECT,
        heading: RECEIPT_EMAIL_SUBJECT,
        body: message.body ?? "Your payment was received and your Ad Credits are in your studio.",
        actionUrl: action,
        button: "View billing",
      });
    case "team-invite":
      return envelope({
        subject: INVITE_EMAIL_SUBJECT,
        heading: INVITE_EMAIL_SUBJECT,
        body: message.body ?? "You've been invited to a Production30 studio.",
        actionUrl: action,
        button: "Open invitation",
      });
    case "support-staff":
      return envelope({
        subject: SUPPORT_STAFF_SUBJECT,
        heading: SUPPORT_STAFF_SUBJECT,
        body: message.body ?? "A customer sent a support message.",
        actionUrl: action,
        button: "Open Admin Support",
      });
    case "support-received":
      return envelope({
        subject: SUPPORT_RECEIVED_SUBJECT,
        heading: SUPPORT_RECEIVED_SUBJECT,
        body: message.body ?? "Thanks. We received your message. We'll email you back.",
        actionUrl: action,
        button: message.buttonLabel ?? "Open Help",
      });
    case "support-reply":
      return envelope({
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
  subject: string;
  heading: string;
  body: string;
  actionUrl: string;
  button: string;
}): RenderedEmail {
  const text = `${input.heading}\n\n${input.body}\n\n${input.button}:\n${input.actionUrl}`;
  const html = `<!doctype html>
<html>
<body style="margin:0;padding:24px;background:#05070F;color:#F4F6FB;font-family:ui-sans-serif,system-ui,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td>
      <p style="font-size:13px;letter-spacing:0.12em;color:#1678FF;margin:0 0 16px;">PRODUCTION30</p>
      <h1 style="font-size:28px;line-height:1.2;margin:0 0 16px;color:#F4F6FB;">${escapeHtml(input.heading)}</h1>
      <p style="font-size:16px;line-height:1.5;color:#9AA3B8;margin:0 0 24px;">${escapeHtml(input.body)}</p>
      <p style="margin:0 0 24px;">
        <a href="${escapeHtml(input.actionUrl)}" style="display:inline-block;background:#1678FF;color:#001038;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">${escapeHtml(input.button)}</a>
      </p>
      <p style="font-size:13px;color:#9AA3B8;margin:0;">If the button does not work, open this link:<br>${escapeHtml(input.actionUrl)}</p>
    </td></tr>
  </table>
</body>
</html>`;
  return { subject: input.subject, text, html };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
