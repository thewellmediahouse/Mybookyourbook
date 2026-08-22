/**
 * Two-factor architecture (Better Auth plugin — do not invent OTP).
 *
 * When enabled, use `twoFactor()` from `better-auth/plugins` and generate
 * the plugin tables with the Better Auth CLI. Require 2FA for Admin, Owner,
 * and Agency once the plugin schema lands.
 */
export const TWO_FACTOR_PLUGIN = "better-auth/plugins.twoFactor" as const;

export const TWO_FACTOR_REQUIRED_ROLES = ["ADMIN", "OWNER", "AGENCY"] as const;

export type TwoFactorRequiredRole = (typeof TWO_FACTOR_REQUIRED_ROLES)[number];
