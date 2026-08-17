/**
 * SEO configuration — maps to SITE_SPEC (docs/SITE_SPEC.schema.json) "SEO" section.
 *
 * Use longer `title` / `description` for search when useful.
 * Optional `ogTitle` / `ogDescription` keep WhatsApp and social share cards shorter
 * (~40–60 / ~120–150 chars). Layout soft-clips when OG fields are omitted.
 */
export type PageSeo = {
  title: string;
  description: string;
  /** Open Graph / Twitter title. Aim ~40–60 characters. */
  ogTitle?: string;
  /** Open Graph / Twitter description. Aim ~120–150 characters. */
  ogDescription?: string;
};

export const seoConfig = {
  /** {{city}} */
  city: 'San Francisco',
  /** {{region}} */
  region: 'California',
  /** {{country}} */
  country: 'United States',
  primaryKeywords: [
    'business consulting',
    'digital strategy',
    'professional services',
  ],
  secondaryKeywords: [
    'brand development',
    'web design agency',
    'small business marketing',
  ],
  /** Default title suffix appended to page titles */
  titleSuffix: 'Acme Business Solutions',
  /**
   * X/Twitter handle without @ — leave empty when the brand has no account.
   * Never invent a handle for checkers.
   */
  twitterHandle: '',
  pages: {
    home: {
      title: 'Acme Business Solutions | Strategy, Design & Technology',
      description:
        'Acme Business Solutions partners with growing businesses to deliver practical strategy, design, and technology.',
      ogTitle: 'Acme Business Solutions | Strategy & Design',
      ogDescription:
        'Practical strategy, design, and technology for growing businesses.',
    },
    about: {
      title: 'About Acme Business Solutions | Your Growth Partner',
      description:
        'Learn how Acme Business Solutions helps teams clarify positioning, build trust, and grow with clarity and confidence.',
      ogTitle: 'About Acme Business Solutions',
      ogDescription:
        'How Acme helps teams clarify positioning, build trust, and grow with confidence.',
    },
    portfolio: {
      title: 'Our Work | Acme Business Solutions Portfolio',
      description:
        'Explore selected projects across strategy, design, and development from Acme Business Solutions.',
      ogTitle: 'Our Work | Acme Business Solutions',
      ogDescription:
        'Selected projects across strategy, design, and development from Acme.',
    },
    contact: {
      title: 'Contact Acme Business Solutions | Book a Consultation',
      description:
        'Contact Acme Business Solutions to discuss your goals and get a clear recommendation for your next step.',
      ogTitle: 'Contact Acme | Book a Consultation',
      ogDescription:
        'Discuss your goals and get a clear recommendation for your next step.',
    },
    services: {
      title: 'Services | Acme Business Solutions',
      description:
        'Explore business strategy, brand and design, web development, and ongoing support from Acme Business Solutions.',
      ogTitle: 'Services | Acme Business Solutions',
      ogDescription:
        'Strategy, brand and design, web development, and ongoing support from Acme.',
    },
    faq: {
      title: 'FAQ | Acme Business Solutions',
      description:
        'Common questions about working with Acme Business Solutions, timelines, and how we help businesses grow.',
      ogTitle: 'FAQ | Acme Business Solutions',
      ogDescription:
        'Common questions about working with Acme, timelines, and how we help businesses grow.',
    },
    shop: {
      title: 'Shop | Acme Business Solutions',
      description:
        'Browse products from Acme Business Solutions. Secure checkout is handled by Shopify.',
      ogTitle: 'Shop | Acme Business Solutions',
      ogDescription:
        'Browse products from Acme. Secure checkout is handled by Shopify.',
    },
    cart: {
      title: 'Cart | Acme Business Solutions',
      description:
        'Review your cart, then complete payment on Shopify’s secure checkout.',
    },
    thankYou: {
      title: 'Thank You | Acme Business Solutions',
      description:
        'Thank you for your order. Your purchase is confirmed and we will be in touch shortly.',
      ogTitle: 'Thank You | Acme Business Solutions',
      ogDescription: 'Your purchase is confirmed. Thank you for your order.',
    },
  } satisfies Record<string, PageSeo>,
} as const;

export type SeoConfig = typeof seoConfig;
