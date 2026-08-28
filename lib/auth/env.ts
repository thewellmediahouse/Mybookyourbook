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

export const WORKERS_DEV_ORIGIN = "https://cineyou.schalk-966.workers.dev";
export const PUBLIC_APP_ORIGIN = "https://production30.thewellmedia.com";

export function getAuthBaseUrl(env: {
  BETTER_AUTH_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
}): string {
  return env.BETTER_AUTH_URL?.trim() || env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
}

function originFromUrl(url: string) {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}

export function getTrustedAuthOrigins(env: {
  BETTER_AUTH_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
}): string[] {
  const listed = [
    getAuthBaseUrl(env),
    env.NEXT_PUBLIC_APP_URL,
    PUBLIC_APP_ORIGIN,
    WORKERS_DEV_ORIGIN,
  ];
  return [...new Set(listed.filter((value): value is string => Boolean(value?.trim())).map(originFromUrl))];
}
