import { shopConfig } from '@/config/shop';
import { getShopifyConfig } from './config';
import { requireSafeCheckoutUrl } from './checkout-url';
import {
  CART_ATTRIBUTES_UPDATE_MUTATION,
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_QUERY,
} from './queries';
import type { ShopifyCart } from './cart-types';

export const CART_STORAGE_KEY = shopConfig.cartStorageKey;
export const CART_UPDATED_EVENT = 'shop:cart-updated';

export type CartLineAttributeInput = { key: string; value: string };
export type CartAttributeInput = { key: string; value: string };

type GraphQLPayload<T> = {
  data?: T;
  errors?: { message: string }[];
};

function getConfigOrThrow() {
  const config = getShopifyConfig();
  if (!config.endpoint || !config.storefrontToken) {
    throw new Error('Checkout is not configured yet. Please contact us.');
  }
  return config;
}

async function storefrontRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const { endpoint, storefrontToken } = getConfigOrThrow();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontToken,
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Shopify request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const payload = (await response.json()) as GraphQLPayload<T>;
  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message || `Shopify request failed (${response.status})`);
  }
  if (!payload.data) {
    throw new Error('Shopify returned no data.');
  }
  return payload.data;
}

function readCartId(): string | null {
  try {
    return localStorage.getItem(CART_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeCartId(cartId: string | null) {
  try {
    if (cartId) localStorage.setItem(CART_STORAGE_KEY, cartId);
    else localStorage.removeItem(CART_STORAGE_KEY);
  } catch {
    // Ignore private-mode storage failures.
  }
}

function normalizeCart(cart: ShopifyCart): ShopifyCart {
  return {
    ...cart,
    attributes: Array.isArray(cart.attributes) ? cart.attributes : [],
    lines: cart.lines?.nodes ? cart.lines : { nodes: [] },
  };
}

function notifyCartUpdated(cart: ShopifyCart | null): ShopifyCart | null {
  const next = cart ? normalizeCart(cart) : null;
  writeCartId(next?.id ?? null);
  window.dispatchEvent(
    new CustomEvent(CART_UPDATED_EVENT, {
      detail: { quantity: next?.totalQuantity ?? 0, cart: next },
    }),
  );
  return next;
}

function userErrorsMessage(errors: { message: string }[] | undefined): string | null {
  if (!errors?.length) return null;
  return errors.map((error) => error.message).join('; ');
}

type CartMutationWarning = { code?: string | null; message: string };

function cartWarningsMessage(warnings: CartMutationWarning[] | undefined): string | null {
  if (!warnings?.length) return null;
  return warnings.map((warning) => warning.message).join('; ');
}

/** Shopify can return qty-0 lines + warnings with empty userErrors. */
function assertCartAcceptedLines(
  cart: ShopifyCart | null,
  warnings: CartMutationWarning[] | undefined,
): ShopifyCart {
  const warningMessage = cartWarningsMessage(warnings);
  if (!cart) {
    throw new Error(warningMessage || 'Could not update cart.');
  }

  const outOfStock = warnings?.some((w) => w.code === 'MERCHANDISE_OUT_OF_STOCK');
  if (outOfStock) {
    throw new Error(warningMessage || 'This option is sold out. Please try another combination.');
  }

  if (warningMessage && cart.totalQuantity <= 0) {
    throw new Error(warningMessage);
  }

  return cart;
}

async function loadCart(notify: boolean): Promise<ShopifyCart | null> {
  const cartId = readCartId();
  if (!cartId) return null;

  const data = await storefrontRequest<{ cart: ShopifyCart | null }>(CART_QUERY, { cartId });
  if (!data.cart) {
    if (notify) notifyCartUpdated(null);
    return null;
  }
  return notify ? notifyCartUpdated(data.cart) : normalizeCart(data.cart);
}

export async function fetchCart(): Promise<ShopifyCart | null> {
  try {
    return await loadCart(true);
  } catch {
    notifyCartUpdated(null);
    return null;
  }
}

/** Read cart without broadcasting `shop:cart-updated` (avoids UI flicker mid-write). */
export async function peekCart(): Promise<ShopifyCart | null> {
  try {
    return await loadCart(false);
  } catch {
    return null;
  }
}

async function createCartWithLines(
  lines: Array<{
    merchandiseId: string;
    quantity: number;
    attributes?: CartLineAttributeInput[];
  }>,
): Promise<ShopifyCart> {
  const created = await storefrontRequest<{
    cartCreate: {
      cart: ShopifyCart | null;
      userErrors: { message: string }[];
      warnings?: CartMutationWarning[];
    };
  }>(CART_CREATE_MUTATION, { lines });

  const error = userErrorsMessage(created.cartCreate.userErrors);
  if (error) throw new Error(error);
  return assertCartAcceptedLines(created.cartCreate.cart, created.cartCreate.warnings);
}

export async function addToCart(
  variantId: string,
  quantity = 1,
  attributes: CartLineAttributeInput[] = [],
): Promise<ShopifyCart> {
  const lines = [
    {
      merchandiseId: variantId,
      quantity,
      ...(attributes.length ? { attributes } : {}),
    },
  ];
  const existingId = readCartId();

  if (existingId) {
    try {
      const data = await storefrontRequest<{
        cartLinesAdd: {
          cart: ShopifyCart | null;
          userErrors: { message: string }[];
          warnings?: CartMutationWarning[];
        };
      }>(CART_LINES_ADD_MUTATION, { cartId: existingId, lines });

      const error = userErrorsMessage(data.cartLinesAdd.userErrors);
      if (error) throw new Error(error);
      const cart = assertCartAcceptedLines(data.cartLinesAdd.cart, data.cartLinesAdd.warnings);
      return notifyCartUpdated(cart)!;
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const shouldRecreate =
        /cart does not exist|cart not found|invalid cart|sold out|already sold out/i.test(message);
      if (!shouldRecreate) throw error;

      try {
        const cart = await createCartWithLines(lines);
        return notifyCartUpdated(cart)!;
      } catch (createError) {
        writeCartId(existingId);
        throw createError;
      }
    }
  }

  const cart = await createCartWithLines(lines);
  return notifyCartUpdated(cart)!;
}

export async function updateCartLine(
  lineId: string,
  quantity: number,
  attributes?: CartLineAttributeInput[],
): Promise<ShopifyCart | null> {
  const cartId = readCartId();
  if (!cartId) return null;

  if (quantity <= 0) {
    return removeCartLine(lineId);
  }

  const lineInput: {
    id: string;
    quantity: number;
    attributes?: CartLineAttributeInput[];
  } = { id: lineId, quantity };
  if (attributes?.length) {
    lineInput.attributes = attributes;
  }

  const data = await storefrontRequest<{
    cartLinesUpdate: { cart: ShopifyCart | null; userErrors: { message: string }[] };
  }>(CART_LINES_UPDATE_MUTATION, {
    cartId,
    lines: [lineInput],
  });

  const error = userErrorsMessage(data.cartLinesUpdate.userErrors);
  if (error) throw new Error(error);
  return notifyCartUpdated(data.cartLinesUpdate.cart);
}

export async function removeCartLine(lineId: string): Promise<ShopifyCart | null> {
  const cartId = readCartId();
  if (!cartId) return null;

  const data = await storefrontRequest<{
    cartLinesRemove: { cart: ShopifyCart | null; userErrors: { message: string }[] };
  }>(CART_LINES_REMOVE_MUTATION, { cartId, lineIds: [lineId] });

  const error = userErrorsMessage(data.cartLinesRemove.userErrors);
  if (error) throw new Error(error);
  return notifyCartUpdated(data.cartLinesRemove.cart);
}

export async function updateCartAttributes(
  attributes: CartAttributeInput[],
): Promise<ShopifyCart> {
  const cartId = readCartId();
  if (!cartId) throw new Error('Your cart is empty.');

  const data = await storefrontRequest<{
    cartAttributesUpdate: { cart: ShopifyCart | null; userErrors: { message: string }[] };
  }>(CART_ATTRIBUTES_UPDATE_MUTATION, { cartId, attributes });

  const error = userErrorsMessage(data.cartAttributesUpdate.userErrors);
  if (error) throw new Error(error);
  if (!data.cartAttributesUpdate.cart) throw new Error('Could not update cart attributes.');
  return notifyCartUpdated(data.cartAttributesUpdate.cart)!;
}

export async function createCheckoutCart(variantId: string, quantity = 1): Promise<string> {
  const data = await storefrontRequest<{
    cartCreate: {
      cart: ShopifyCart | null;
      userErrors: { message: string }[];
      warnings?: CartMutationWarning[];
    };
  }>(CART_CREATE_MUTATION, {
    lines: [{ merchandiseId: variantId, quantity }],
  });

  const error = userErrorsMessage(data.cartCreate.userErrors);
  if (error) throw new Error(error);
  const cart = assertCartAcceptedLines(data.cartCreate.cart, data.cartCreate.warnings);
  const checkoutUrl = cart.checkoutUrl;
  if (!checkoutUrl) throw new Error('Could not start checkout.');
  return requireSafeCheckoutUrl(checkoutUrl);
}
