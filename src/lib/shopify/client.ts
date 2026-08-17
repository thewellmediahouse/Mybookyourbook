import { getShopifyConfig, isShopifyConfigured } from './config';

type ShopifyResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

export class ShopifyRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShopifyRequestError';
  }
}

export async function storefrontFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  if (!isShopifyConfigured()) {
    throw new ShopifyRequestError('Shopify Storefront is not configured.');
  }

  const { endpoint, storefrontToken } = getShopifyConfig();

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': storefrontToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new ShopifyRequestError(`Shopify Storefront HTTP ${response.status}`);
  }

  const payload = (await response.json()) as ShopifyResponse<T>;

  if (payload.errors?.length) {
    throw new ShopifyRequestError(payload.errors.map((error) => error.message).join('; '));
  }

  if (!payload.data) {
    throw new ShopifyRequestError('Shopify Storefront returned no data.');
  }

  return payload.data;
}
