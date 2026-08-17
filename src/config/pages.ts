/**
 * Page visibility and section composition — maps to SITE_SPEC `pages` (docs/SITE_SPEC.schema.json).
 */
export const pagesConfig = {
  home: true,
  about: true,
  services: true,
  contact: true,
  privacy: true,
  terms: true,
  faq: true,
  pricing: false,
  portfolio: false,
  shop: true,
  blog: false,
  team: false,
  testimonials: false,

  /** Optional strip above the header (promo / shipping / hours). */
  announcement: {
    enabled: false,
    message: '',
  },

  header: {
    sticky: true,
    logoVariant: 'standard' as 'standard' | 'white' | 'dark',
    ctaEnabled: true,
  },

  messagingBubble: {
    enabled: false,
  },

  /** Optional scroll-reveal / hover motion (respects prefers-reduced-motion). */
  motion: {
    enabled: true,
  },

  sections: {
    home: {
      hero: true,
      trustBar: true,
      impactStrip: true,
      statementBand: true,
      servicesPreview: true,
      pricingSelector: false,
      shopPreview: true,
      consultationCta: false,
      closingCta: true,
      featuredWork: false,
      testimonials: true,
      faq: false,
    },
    about: {
      hero: true,
      intro: true,
      capabilities: true,
      process: true,
      whyChooseUs: true,
      phasedImplementation: false,
      cta: true,
    },
    portfolio: {
      hero: true,
      portfolioGrid: true,
      stats: false,
      cta: true,
    },
    contact: {
      hero: true,
      form: true,
      bookingMockup: false,
      contactInfo: true,
      map: true,
      faq: false,
      cta: false,
    },
    services: {
      pageHeader: true,
      serviceGrid: true,
      packageOverview: false,
      bundles: false,
      alaCarte: false,
      terminology: false,
      cta: true,
    },
  },
} as const;

export type PagesConfig = typeof pagesConfig;
export type PageKey = keyof Pick<
  PagesConfig,
  | 'home'
  | 'about'
  | 'services'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'faq'
  | 'pricing'
  | 'portfolio'
  | 'shop'
  | 'blog'
  | 'team'
  | 'testimonials'
>;
