import { getShopifyConfig } from './config';
import { PRODUCT_AVAILABILITY_QUERY, PRODUCTS_AVAILABILITY_QUERY } from './queries';
import type { Money } from './types';

type GraphQLPayload<T> = {
  data?: T;
  errors?: { message: string }[];
};

async function storefrontRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T | null> {
  const { endpoint, storefrontToken } = getShopifyConfig();
  if (!endpoint || !storefrontToken) return null;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    const payload = (await response.json()) as GraphQLPayload<T>;
    if (!response.ok || payload.errors?.length || !payload.data) return null;
    return payload.data;
  } catch {
    return null;
  }
}

export type CatalogAvailability = {
  handle: string;
  availableForSale: boolean;
  price?: Money;
};

export type VariantAvailability = {
  id: string;
  availableForSale: boolean;
  price: Money;
};

export async function fetchCatalogAvailability(first = 100): Promise<CatalogAvailability[]> {
  const data = await storefrontRequest<{
    products: {
      nodes: {
        handle: string;
        availableForSale: boolean;
        priceRange: { minVariantPrice: Money };
      }[];
    };
  }>(PRODUCTS_AVAILABILITY_QUERY, { first });

  return (
    data?.products.nodes.map((product) => ({
      handle: product.handle,
      availableForSale: product.availableForSale,
      price: product.priceRange.minVariantPrice,
    })) ?? []
  );
}

export async function fetchProductAvailability(handle: string): Promise<{
  availableForSale: boolean;
  variants: VariantAvailability[];
} | null> {
  const data = await storefrontRequest<{
    product: {
      availableForSale: boolean;
      variants: { nodes: VariantAvailability[] };
    } | null;
  }>(PRODUCT_AVAILABILITY_QUERY, { handle });

  if (!data?.product) return null;
  return {
    availableForSale: data.product.availableForSale,
    variants: data.product.variants.nodes,
  };
}
