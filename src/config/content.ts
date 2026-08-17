import { siteConfig } from '@/config/site';

/**
 * Page section content — maps to SITE_SPEC `content` (docs/SITE_SPEC.schema.json).
 * Populate from SITE_SPEC.yaml when generating a new site.
 */
export interface OutcomeCard {
  title: string;
  description: string;
}

export interface ProcessStep {
  step: number;
  title: string;
  description: string;
}

export interface PhaseCard {
  phase: number;
  title: string;
  description: string;
}

export interface StatItem {
  label: string;
  value: string;
  note?: string;
}

export interface HeroDecorOptions {
  /** Show optional hero background decor (full section width) */
  enabled?: boolean;
  /** 0–1 opacity over the hero gradient */
  opacity?: number;
  /** Static background image (webp, jpg, etc.) */
  image?: {
    src: string;
    alt?: string;
  };
  /** Background video (webm, mp4) — takes precedence over image when set */
  video?: {
    src: string;
    /** Shown before playback and when video is unsupported */
    poster?: string;
  };
}

export interface HeroContent {
  /**
   * Hero composition.
   * - `split` (default): two-column copy + inset media
   * - `fullBleed`: edge-to-edge photo/video plane with overlay copy
   */
  layout?: 'split' | 'fullBleed';
  /** Primary heading line (default text colour) */
  heading: string;
  /** Optional second line with accent gradient — still a single h1 for SEO */
  headingHighlight?: string;
  subheading?: string;
  paragraph?: string;
  trustPoints?: string[];
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  /**
   * Full-bleed scrim strength (0–1). Darkens media behind overlay copy.
   * Only used when `layout: 'fullBleed'`. Default 0.55.
   */
  overlayOpacity?: number;
  /** Optional full-width hero background decor — set per page in contentConfig.*.hero.decor */
  decor?: HeroDecorOptions;
  media?: {
    type: 'image' | 'video' | 'none';
    /** Public path (`/images/…`) or `raster.ts` key (e.g. `hero`) */
    src?: string;
    alt?: string;
    caption?: string;
    videoUrl?: string;
    /** Background video poster (public path) when `type: 'video'` */
    poster?: string;
  };
}

export interface CtaBlock {
  heading: string;
  paragraph?: string;
  bullets?: string[];
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  image?: { src: string; alt: string }; // `src`: raster key or public path
  includeBookingMockup?: boolean;
}

export interface TrustBarItem {
  label: string;
  /** Built-in icon: star | shield | check | delivery */
  icon?: string;
}

export interface ClosingCtaContent {
  eyebrow?: string;
  heading: string;
  paragraph?: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  image?: { src: string; alt?: string };
}

export interface PageHeaderContent {
  title: string;
  headingHighlight?: string;
  intro?: string;
}

export const contentConfig = {
  outcomes: [
    { title: 'Clear direction', description: 'Align your team around priorities that matter.' },
    { title: 'Stronger brand', description: 'Build trust from the first impression.' },
    { title: 'Better conversions', description: 'Turn visitors into qualified enquiries.' },
    { title: 'Sustainable growth', description: 'Systems that scale with your business.' },
  ] satisfies OutcomeCard[],

  processSteps: [
    {
      step: 1,
      title: 'Discover',
      description: 'We learn your goals, audience, and constraints through focused discovery.',
    },
    {
      step: 2,
      title: 'Plan',
      description: 'We define scope, milestones, and success metrics before work begins.',
    },
    {
      step: 3,
      title: 'Deliver',
      description: 'We execute with senior oversight and regular check-ins.',
    },
    {
      step: 4,
      title: 'Grow',
      description: 'We refine, measure, and support what comes after launch.',
    },
  ] satisfies ProcessStep[],

  phasedImplementation: {
    intro:
      'Start where you are. We can phase work across foundation, momentum, and scale so investment stays flexible.',
    phases: [
      {
        phase: 1,
        title: 'Foundation',
        description: 'Brand clarity, core messaging, and essential digital presence.',
      },
      {
        phase: 2,
        title: 'Momentum',
        description: 'Campaigns, content systems, and conversion improvements.',
      },
      {
        phase: 3,
        title: 'Scale',
        description: 'Ongoing partnership, optimization, and new growth channels.',
      },
    ] satisfies PhaseCard[],
  },

  whyChooseUs: {
    heading: 'Why work with us',
    paragraph:
      'We combine strategy, design, and execution so you get outcomes—not just deliverables.',
    bullets: [
      'Senior-led on every engagement',
      'Transparent scopes and pricing',
      'Launch-ready work in weeks, not months',
      'Support after go-live',
    ],
  },

  capabilities: [
    'Business strategy',
    'Brand & design',
    'Web development',
    'Content & marketing',
    'Ongoing support',
  ],

  stats: [
    { label: 'Projects delivered', value: '50+', note: 'Placeholder — replace with verified data' },
    { label: 'Client satisfaction', value: '98%', note: 'Placeholder — replace with verified data' },
    { label: 'Avg. launch time', value: '4–6 wks', note: 'Placeholder — replace with verified data' },
    { label: 'Industries served', value: '12+', note: 'Placeholder — replace with verified data' },
  ] satisfies StatItem[],

  home: {
    hero: {
      layout: 'fullBleed',
      heading: 'Helping businesses grow with clarity and confidence',
      subheading: 'Strategy, design, and technology under one roof',
      paragraph:
        'We partner with growing businesses to deliver practical outcomes—clear positioning, polished digital experiences, and systems that support long-term growth.',
      primaryCta: { label: 'Get started', href: '/contact/' },
      secondaryCta: { label: 'Our services', href: '/services/' },
      media: {
        type: 'image',
        src: '/images/hero.svg',
        alt: 'Professional team collaborating in a modern workspace',
      },
    } satisfies HeroContent,
    trustBar: [
      { label: 'Senior-led', icon: 'star' },
      { label: 'Transparent pricing', icon: 'shield' },
      { label: 'Launch-ready', icon: 'check' },
    ] satisfies TrustBarItem[],
    statementBand: 'Clear strategy. Polished delivery. Measurable growth.',
    servicesPreview: {
      heading: 'Services built for growth',
      subheading: 'End-to-end support tailored to your stage of growth.',
      limit: 4 as number | 'all',
    },
    pricingSelector: {
      heading: 'Flexible plans for every stage',
    },
    featuredWork: {
      heading: 'Featured work',
    },
    consultationCta: {
      heading: 'Ready to talk about your goals?',
      paragraph:
        'Book a discovery call and get a clear recommendation for your next step—no pressure, no jargon.',
      bullets: ['Free initial consultation', 'Clear scope and timeline', 'Honest fit assessment'],
      primaryCta: { label: 'Book a consultation', href: '/contact/' },
      includeBookingMockup: false,
      image: {
        src: '/images/hero.svg',
        alt: 'Consultation meeting placeholder image',
      },
    } satisfies CtaBlock,
    closingCta: {
      eyebrow: 'Next step',
      heading: 'Ready to talk about your goals?',
      paragraph:
        'Book a discovery call and get a clear recommendation for your next step—no pressure, no jargon.',
      primaryCta: { label: 'Book a consultation', href: '/contact/' },
      secondaryCta: { label: 'View services', href: '/services/' },
      image: {
        src: '/images/hero.svg',
        alt: '',
      },
    } satisfies ClosingCtaContent,
  },

  about: {
    hero: {
      heading: 'About Acme Business Solutions',
      subheading: 'Your partner for practical growth',
      paragraph: siteConfig.longDescription,
      primaryCta: { label: 'Contact us', href: '/contact/' },
      media: {
        type: 'image',
        src: '/images/hero.svg',
        alt: 'Team collaboration placeholder image',
      },
    } satisfies HeroContent,
    intro: {
      heading: 'What we do',
      paragraph:
        'We help founders and operators move faster with less friction—from brand and web to go-to-market execution.',
    },
    cta: {
      heading: "Let's talk about your goals",
      primaryCta: { label: 'Schedule a call', href: '/contact/' },
    },
  },

  portfolio: {
    hero: {
      heading: 'Our work',
      paragraph: 'A selection of projects that reflect our approach to strategy, design, and delivery.',
      primaryCta: { label: 'Start a project', href: '/contact/' },
      media: {
        type: 'image',
        src: '/images/hero.svg',
        alt: 'Portfolio showcase placeholder image',
      },
    } satisfies HeroContent,
    cta: {
      heading: 'Have a project in mind?',
      primaryCta: { label: 'Get in touch', href: '/contact/' },
      secondaryCta: { label: 'View services', href: '/services/' },
    },
  },

  contact: {
    hero: {
      heading: 'Contact us',
      paragraph: 'Share a few details and we will respond within one business day.',
      primaryCta: { label: 'Send a message', href: '#contact-form' },
      media: {
        type: 'image',
        src: '/images/hero.svg',
        alt: 'Contact page placeholder image',
      },
    } satisfies HeroContent,
    bookingMockup: {
      title: 'Pick a time that works',
      times: ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'],
      confirmLabel: 'Confirm selection',
    },
    cta: {
      heading: 'Prefer to talk now?',
      primaryCta: { label: 'Call us', href: 'tel:+15551234567' },
    },
  },

  services: {
    pageHeader: {
      title: 'Our services',
      intro: 'End-to-end support tailored to your stage of growth.',
    } satisfies PageHeaderContent,
    bundles: {
      heading: 'One-Off / Bundle Packages',
      subheading: 'Fixed-price packages for launches and bundled deliverables.',
    },
    alaCarte: {
      heading: 'Individual / À La Carte Items',
      subheading: 'Standalone pricing for individual deliverables.',
    },
    terminology: {
      heading: 'Terminology Definitions',
      subheading: 'Key terms used in package descriptions.',
    },
    cta: {
      heading: 'Not sure where to start?',
      primaryCta: { label: 'Book a consultation', href: '/contact/' },
    },
  },
} as const;

export type ContentConfig = typeof contentConfig;
