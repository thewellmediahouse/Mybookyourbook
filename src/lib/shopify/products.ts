import { storefrontFetch } from './client';
import { isShopifyConfigured } from './config';
import {
  PRODUCT_BY_HANDLE_QUERY,
  PRODUCT_RECOMMENDATIONS_QUERY,
  PRODUCTS_QUERY,
} from './queries';
import type { ProductDetail, ProductSummary } from './types';

type ProductsData = {
  products: { nodes: ProductSummary[] };
};

type ProductData = {
  product: ProductDetail | null;
};

type ProductRecommendationsData = {
  productRecommendations: ProductSummary[] | null;
};

export type CatalogLoadStatus =
  | 'success'
  | 'empty'
  | 'config_missing'
  | 'request_failed';

export type CatalogLoadResult = {
  status: CatalogLoadStatus;
  products: ProductSummary[];
  /** Safe customer-facing message when not success. */
  message?: string;
};

function isDev(): boolean {
  try {
    return Boolean(import.meta.env.DEV);
  } catch {
    return process.env.NODE_ENV !== 'production';
  }
}

/**
 * Load published Storefront products.
 * Distinguishes missing config, empty catalog, and request failures.
 */
export async function loadShopCatalog(pageSize = 50): Promise<CatalogLoadResult> {
  if (!isShopifyConfigured()) {
    return {
      status: 'config_missing',
      products: [],
      message: isDev()
        ? 'Shopify Storefront configuration is missing (PUBLIC_SHOPIFY_STORE_DOMAIN / PUBLIC_SHOPIFY_STOREFRONT_TOKEN).'
        : 'Please refresh the page or contact us for assistance.',
    };
  }

  try {
    const data = await storefrontFetch<ProductsData>(PRODUCTS_QUERY, { first: pageSize });
    const products = data.products.nodes;

    if (!products.length) {
      return {
        status: 'empty',
        products: [],
        message: 'Products published in Shopify will appear here.',
      };
    }

    return { status: 'success', products };
  } catch (error) {
    console.error('[shopify] Failed to load catalog', error);
    return {
      status: 'request_failed',
      products: [],
      message: isDev()
        ? error instanceof Error
          ? error.message
          : 'Shopify Storefront request failed.'
        : 'Please refresh the page or contact us for assistance.',
    };
  }
}

/** Convenience wrapper for callers that only need product nodes. */
export async function getProducts(first = 50): Promise<ProductSummary[]> {
  const result = await loadShopCatalog(first);
  return result.products;
}

export async function getProductByHandle(handle: string): Promise<ProductDetail | null> {
  if (!isShopifyConfigured() || !handle) return null;

  try {
    const data = await storefrontFetch<ProductData>(PRODUCT_BY_HANDLE_QUERY, { handle });
    return data.product;
  } catch (error) {
    console.error(`[shopify] Failed to load product "${handle}":`, error);
    return null;
  }
}

export async function getProductHandles(): Promise<string[]> {
  const result = await loadShopCatalog(100);
  return result.products.map((product) => product.handle);
}

/**
 * Related products for a PDP: Shopify recommendations first, then catalog fill.
 * Excludes the current product and caps at `limit` (default 3).
 */
export async function getRelatedProducts(
  productId: string,
  options: { limit?: number } = {},
): Promise<ProductSummary[]> {
  if (!isShopifyConfigured() || !productId) return [];

  const limit = options.limit ?? 3;
  const related: ProductSummary[] = [];
  const seen = new Set<string>([productId]);

  try {
    const data = await storefrontFetch<ProductRecommendationsData>(PRODUCT_RECOMMENDATIONS_QUERY, {
      productId,
    });
    for (const product of data.productRecommendations ?? []) {
      if (seen.has(product.id)) continue;
      seen.add(product.id);
      related.push(product);
      if (related.length >= limit) return related;
    }
  } catch (error) {
    console.error('[shopify] Failed to load product recommendations:', error);
  }

  try {
    const catalog = await getProducts(50);
    const fill = catalog
      .filter((product) => !seen.has(product.id))
      .sort((a, b) => Number(b.availableForSale) - Number(a.availableForSale));

    for (const product of fill) {
      related.push(product);
      if (related.length >= limit) break;
    }
  } catch (error) {
    console.error('[shopify] Failed to fill related products from catalog:', error);
  }

  return related;
}
