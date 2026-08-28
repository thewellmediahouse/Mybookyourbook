import type { EmailMessage, EmailProvider } from "./types";

export function createResendEmailProvider(apiKey: string, from: string): EmailProvider {
  return {
    async send(message: EmailMessage) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          ...(message.idempotencyKey ? { "Idempotency-Key": message.idempotencyKey } : {}),
        },
        body: JSON.stringify({
          from,
          to: [message.to],
          subject: message.subject,
          text: message.text,
          html: message.html ?? `<p>${message.text}</p>`,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { name?: string; message?: string } | null;
        if (response.status === 409 && payload?.name === "concurrent_idempotent_requests") {
          return;
        }
        const detail = [payload?.name, payload?.message].filter(Boolean).join(": ");
        throw new Error(`Email provider rejected the message (${response.status}${detail ? ` ${detail}` : ""}).`);
      }
    },
  };
}
