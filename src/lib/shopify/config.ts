import { shopifyPublicDefaults } from '@/config/shopify-public';

function clean(value: string | undefined): string {
  return (value ?? '').trim();
}

export function getShopifyConfig() {
  const domain =
    clean(import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN) || shopifyPublicDefaults.storeDomain;
  const storefrontToken =
    clean(import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN) ||
    shopifyPublicDefaults.storefrontToken;
  const apiVersion =
    clean(import.meta.env.PUBLIC_SHOPIFY_API_VERSION) || shopifyPublicDefaults.apiVersion;

  const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return {
    domain: normalizedDomain,
    storefrontToken,
    apiVersion,
    endpoint: normalizedDomain
      ? `https://${normalizedDomain}/api/${apiVersion}/graphql.json`
      : '',
  };
}

export function isShopifyConfigured(): boolean {
  const { domain, storefrontToken } = getShopifyConfig();
  return Boolean(domain && storefrontToken);
}
