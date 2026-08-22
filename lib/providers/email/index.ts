import { createMockEmailProvider } from "./mock";
import { createResendEmailProvider } from "./resend";
import type { EmailProvider } from "./types";

export function getEmailProvider(env: {
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
}): EmailProvider {
  if (env.RESEND_API_KEY && env.EMAIL_FROM) {
    return createResendEmailProvider(env.RESEND_API_KEY, env.EMAIL_FROM);
  }
  return createMockEmailProvider();
}

export type { EmailMessage, EmailProvider } from "./types";
