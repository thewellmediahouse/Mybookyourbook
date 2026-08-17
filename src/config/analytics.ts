/**
 * Marketing / analytics IDs — site-local; keep secrets out of this file.
 * Pixel / gtag IDs are public-by-design (ship in the browser).
 * Empty strings disable injection. Scripts load only when `getSiteEnv() === 'production'`.
 */
export const analyticsConfig = {
  /** Facebook / Meta Pixel — empty string disables injection. */
  metaPixelId: '',
  /** Google Analytics 4 measurement ID (gtag.js) — empty string disables injection. */
  googleMeasurementId: '',
} as const;

export type AnalyticsConfig = typeof analyticsConfig;
