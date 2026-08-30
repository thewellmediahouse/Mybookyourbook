export const SITE_NAME = "Production30";
export const SITE_TAGLINE = "Your business, starring you.";
export const SITE_TITLE = "Production30 — Professional AI Business Commercials";
export const SITE_DESCRIPTION =
  "Create a professional business video advert starring you. Brief Production30 about your business, provide your references, approve the concept and receive a finished 30-second commercial.";

export const PUBLIC_PATHS = [
  "/",
  "/pricing",
  "/how-it-works",
  "/examples",
  "/contact",
  "/privacy",
  "/terms",
  "/acceptable-use",
  "/login",
  "/signup",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
] as const;

export function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  return new URL(path, `${siteOrigin()}/`).toString();
}
