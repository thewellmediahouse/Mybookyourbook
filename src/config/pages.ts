/**
 * Page visibility and section composition — The Well Media
 * Source: docs/TheWellMediaHouseWebsiteInputSpec.md
 */
export const pagesConfig = {
  home: true,
  about: true,
  services: false,
  contact: true,
  privacy: true,
  terms: true,
  faq: true,
  pricing: true,
  portfolio: true,
  blog: false,
  team: false,
  testimonials: false,

  header: {
    sticky: true,
    logoVariant: 'white' as 'standard' | 'white' | 'dark',
    /** Raster brand key from `src/assets/raster.ts` */
    logoKey: 'wmhLogoWhite' as 'wmhLogoWhite' | 'logoWhiteHeader',
    ctaEnabled: true,
  },

  messagingBubble: {
    enabled: true,
  },

  sections: {
    home: {
      hero: true,
      statsStrip: true,
      mediaImpactBanner: true,
      interactiveExperiences: true,
      clientShowcase: true,
      clientLogoMarquee: true,
      consultationProcess: true,
      liveEventSalesStrategy: false,
      servicesPreview: true,
      clientLogos: false,
      featuredWork: false,
      differentiators: true,
      testimonials: true,
      consultationCta: true,
      proofStrip: false,
      processSteps: false,
      growthPath: false,
      impactStrip: false,
      pricingSelector: false,
      faq: false,
    },
    about: {
      hero: true,
      intro: true,
      capabilities: true,
      process: true,
      whyChooseUs: true,
      phasedImplementation: true,
      cta: true,
    },
    portfolio: {
      hero: true,
      portfolioGrid: false,
      videos: true,
      beforeAfter: true,
      foodPhotographyGallery: true,
      realEstateGallery: true,
      behindScenesGallery: true,
      photos: false,
      stats: false,
      cta: true,
    },
    contact: {
      hero: true,
      form: true,
      bookingMockup: false,
      contactInfo: true,
      faq: true,
      cta: true,
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
    pricing: {
      hero: true,
      pricingLogic: true,
      journeyStrip: false,
      visualServices: false,
      launchPack: true,
      monthlySupport: true,
      alaCarte: true,
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
