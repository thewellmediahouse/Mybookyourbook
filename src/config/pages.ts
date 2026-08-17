/**
 * Page visibility and section composition — maps to NEW_WEBSITE_INPUT_SPEC
 * "Pages Required" and per-page section enable/disable.
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
  blog: false,
  team: false,
  testimonials: false,

  header: {
    sticky: true,
    logoVariant: 'standard' as 'standard' | 'white' | 'dark',
    ctaEnabled: true,
  },

  messagingBubble: {
    enabled: false,
  },

  sections: {
    home: {
      hero: true,
      impactStrip: true,
      servicesPreview: true,
      pricingSelector: false,
      consultationCta: true,
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
  | 'blog'
  | 'team'
  | 'testimonials'
>;
