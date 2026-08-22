import type { EmailProvider } from "./types";

/** No paid provider. Logs the message; never pretends mail was delivered to a real inbox. */
export function createMockEmailProvider(): EmailProvider {
  return {
    async send(message) {
      console.info("[production30:email:mock]", {
        to: message.to,
        subject: message.subject,
        text: message.text,
        idempotencyKey: message.idempotencyKey,
      });
    },
  };
}
