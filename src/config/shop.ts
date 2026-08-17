import { siteConfig } from './site';

/**
 * Shop copy + behaviour — maps to SITE_SPEC `shop` (docs/SITE_SPEC.schema.json).
 * Omit / set pages.shop false when unused. Catalog data comes from Shopify Storefront API.
 */
export interface ShopCta {
  label: string;
  href: string;
  external?: boolean;
}

export interface ShopAddonPricing {
  /** Shopify option name used for the add-on (e.g. "Installation"). */
  optionName: string;
  /** Option value that means "no add-on" (e.g. "Supply only"). */
  baseValue: string;
  /** Shown under the option radios when the add-on option is present. */
  note?: string;
  /** Labels for the PDP price breakdown when an add-on variant is selected. */
  breakdownLabels: {
    unit: string;
    addon: string;
  };
}

export const shopConfig = {
  /** Intl locale for money formatting (defaults to site locale). */
  moneyLocale: siteConfig.locale,
  /** localStorage key for the Shopify cart id. */
  cartStorageKey: 'shop_cart_id',

  availability: {
    available: 'Available',
    unavailable: 'Unavailable',
    unavailableCombination: 'Unavailable combination',
    currentlyUnavailable: 'Currently unavailable',
  },

  labels: {
    addToCart: 'Add to cart',
    buyNow: 'Buy now',
    soldOut: 'Sold out',
    viewProduct: 'View product',
    viewCart: 'View cart',
    continueShopping: 'Continue shopping',
    secureCheckout: 'Secure checkout',
    remove: 'Remove',
    quantity: 'Quantity',
    subtotal: 'Subtotal',
    backToShop: '← Back to shop',
    noImage: 'No image',
  },

  /**
   * Optional variant add-on pricing (e.g. supply vs supply+install).
   * Null/disabled for most sites — enable only when Shopify options match these names.
   */
  addonPricing: null as ShopAddonPricing | null,

  preview: {
    eyebrow: 'Shop',
    heading: 'Browse our products',
    paragraph:
      'Explore selected items from our online store. Checkout is handled securely by Shopify.',
    viewAll: { label: 'View all products', href: '/shop/' } as ShopCta,
    button: { label: 'Browse the store', href: '/shop/' } as ShopCta,
    image: {
      src: '/images/hero.svg',
      alt: 'Online store preview placeholder',
    },
  },

  live: {
    eyebrow: 'Online store',
    heading: 'Shop',
    headingHighlight: 'our products',
    paragraph:
      'Browse the catalog below. Add items to your cart on this site, then complete payment on Shopify’s secure checkout.',
    secondaryCtas: [{ label: 'Contact us', href: '/contact/' }] as ShopCta[],
  },

  comingSoon: {
    eyebrow: 'Coming soon',
    heading: 'Online store',
    headingHighlight: 'on the way',
    paragraph:
      'We’re preparing a branded product catalog with secure Shopify checkout. Meanwhile, get in touch for product enquiries.',
    primaryCta: { label: 'Contact us', href: '/contact/' } as ShopCta,
    secondaryCta: undefined as ShopCta | undefined,
    image: {
      src: '/images/hero.svg',
      alt: 'Online store coming soon placeholder',
    },
    note: 'Connect Shopify Storefront credentials to publish live products.',
    categories: ['Featured', 'New arrivals', 'Essentials'],
  },

  cart: {
    heading: 'Your cart',
    paragraph:
      'Review items here. Payment is completed on Shopify’s secure checkout.',
    emptyHeading: 'Your cart is empty',
    emptyParagraph: 'Browse the store and add products when you’re ready.',
    browseLabel: 'Browse the store',
    checkoutNote:
      'You’ll leave this site only for payment. Shopify handles card details securely. Brand checkout under Admin → Settings → Checkout.',
  },

  product: {
    checkoutHint:
      'Select options if shown, add items to your cart on this site, then pay on Shopify’s secure checkout.',
    secondaryCtas: [{ label: 'Ask about this product', href: '/contact/' }] as ShopCta[],
    related: {
      heading: 'You may also like',
      paragraph: 'More products from our store available to order.',
    },
  },

  emptyCatalog: {
    heading: 'No products listed yet',
    paragraph:
      'Products published in Shopify will appear here. Contact us if you need something sooner.',
  },

  catalogError: {
    heading: 'We couldn’t load the shop.',
    paragraph: 'Please refresh the page or contact us for assistance.',
    retryLabel: 'Retry',
  },

  configMissing: {
    heading: 'We couldn’t load the shop.',
    paragraph: 'Please refresh the page or contact us for assistance.',
    devParagraph: 'Shopify Storefront configuration is missing.',
    retryLabel: 'Retry',
  },
} as const;

export type ShopConfig = typeof shopConfig;
