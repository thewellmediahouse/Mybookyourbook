import { getShopifyConfig } from './config';

/** Known Shopify-hosted checkout hosts (in addition to the configured store domain). */
const SHOPIFY_CHECKOUT_HOSTS = new Set(['checkout.shopify.com', 'shop.app']);

/**
 * True when `url` is an https Shopify checkout destination we are willing to redirect to.
 * Allows the configured store domain, `*.myshopify.com`, and a small Shopify host allowlist.
 */
export function isAllowedShopifyCheckoutUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;

    const host = parsed.hostname.toLowerCase();
    const storeHost = getShopifyConfig().domain.toLowerCase();

    if (storeHost && host === storeHost) return true;
    if (host.endsWith('.myshopify.com')) return true;
    if (SHOPIFY_CHECKOUT_HOSTS.has(host)) return true;

    return false;
  } catch {
    return false;
  }
}

/** Returns the URL if allowlisted; otherwise `null`. */
export function getSafeCheckoutUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return isAllowedShopifyCheckoutUrl(url) ? url : null;
}

/** Returns the URL or throws if it is missing / not allowlisted. */
export function requireSafeCheckoutUrl(url: string | null | undefined): string {
  const safe = getSafeCheckoutUrl(url);
  if (!safe) {
    throw new Error('Checkout link was rejected. Please try again or contact us.');
  }
  return safe;
}
