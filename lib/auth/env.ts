export function isEmailSendingConfigured(env: {
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
} & object): boolean {
  const mail = env as { RESEND_API_KEY?: string; EMAIL_FROM?: string };
  return Boolean(mail.RESEND_API_KEY?.trim() && mail.EMAIL_FROM?.trim());
}

export function isGoogleAuthConfigured(env: {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
} & object): boolean {
  const google = env as { GOOGLE_CLIENT_ID?: string; GOOGLE_CLIENT_SECRET?: string };
  return Boolean(google.GOOGLE_CLIENT_ID?.trim() && google.GOOGLE_CLIENT_SECRET?.trim());
}

export function getAuthSecret(env: { BETTER_AUTH_SECRET?: string }): string {
  const secret = env.BETTER_AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is not set.");
  }
  return secret;
}

export function getAuthBaseUrl(env: {
  BETTER_AUTH_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
}): string {
  return env.BETTER_AUTH_URL?.trim() || env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
}
