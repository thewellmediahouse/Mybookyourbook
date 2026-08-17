/**
 * Optional committed Storefront defaults when PUBLIC_SHOPIFY_* env vars are unset.
 *
 * Prefer Cloudflare / local `.env` for real stores. Leave empty on the template so
 * the sample site shows Coming Soon until a site wires credentials.
 *
 * Storefront tokens are designed for browser use. Never put Admin API secrets
 * (shpss_ / shpat_) here.
 */
export const shopifyPublicDefaults = {
  storeDomain: '',
  storefrontToken: '',
  apiVersion: '2025-01',
} as const;
