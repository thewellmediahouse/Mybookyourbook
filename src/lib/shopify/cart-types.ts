import type { Money } from './types';

export type CartMerchandise = {
  id: string;
  title: string;
  product: {
    title: string;
    handle: string;
  };
  image: {
    url: string;
    altText: string | null;
  } | null;
  price: Money;
};

export type CartLineAttribute = {
  key: string;
  value: string;
};

export type CartLine = {
  id: string;
  quantity: number;
  attributes?: CartLineAttribute[];
  merchandise: CartMerchandise;
};

export type CartAttribute = {
  key: string;
  value: string;
};

export type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  attributes?: CartAttribute[];
  cost: {
    totalAmount: Money;
  };
  lines: {
    nodes: CartLine[];
  };
};
