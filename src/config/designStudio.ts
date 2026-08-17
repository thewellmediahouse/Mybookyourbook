/**
 * Design Your Website — Design Studio config
 * Pricing derives from packagesConfig.alaCarte where possible.
 */
import { DESIGN_STUDIO_PROMPT_VERSION } from '@/ai/design-studio/promptVersion';
import { DESIGN_STUDIO_ENABLED } from '@/config/designStudio.flag';
import { packagesConfig } from '@/config/packages';
import { UPLOAD_LIMITS } from '@/utils/design-studio/uploads';
import { validateConceptResponse } from '@/utils/design-studio/validateConceptResponse';
import type { ConceptDirection } from '@/types/designStudio';

function parseZarAmount(price: string): number | null {
  const digits = price.replace(/[^\d]/g, '');
  if (!digits) return null;
  return Number.parseInt(digits, 10);
}

function alaCartePrice(itemIncludes: string): number | null {
  const match = packagesConfig.alaCarte.find((entry) =>
    entry.item.toLowerCase().includes(itemIncludes.toLowerCase()),
  );
  return match ? parseZarAmount(match.price) : null;
}

const staticWebsitePriceZar = alaCartePrice('Website development alone') ?? 7000;
const onlineShopFromZar = alaCartePrice('Online shop with 20 product') ?? 10000;
const websiteWithShopPriceZar = alaCartePrice('Both website and online shop') ?? 15000;

export const designStudioConfig = {
  /**
   * Feature flag — set `DESIGN_STUDIO_ENABLED` in `designStudio.flag.ts` to publish
   * `/design-your-website` pages, nav links, and APIs. Keep code in place when off.
   */
  enabled: DESIGN_STUDIO_ENABLED,
  route: '/design-your-website',
  createRoute: '/design-your-website/create',
  resultsRoutePrefix: '/design-your-website/results',
  demoResultsRoute: '/design-your-website/results/demo',
  /** Phase 10 will collect contact + pricing here */
  contactRoute: '/design-your-website/contact',
  /** Team handoff UI — protect with Cloudflare Access in production */
  internalRoute: '/design-your-website/internal',

  /**
   * Public Turnstile site key baked into the wizard HTML at Astro build time.
   * Override in create.astro via PUBLIC_TURNSTILE_SITE_KEY — do not use Worker-only vars.
   * Keep this as a plain string (this file is also imported by the Worker bundle).
   */
  turnstileSiteKey: '0x4AAAAAAD3XVpJh-S8psGfC',

  branding: {
    title: 'Design Your Website',
    eyebrow: 'DESIGN YOUR WEBSITE',
    tagline: 'Create the direction. We build the real thing.',
    descriptor:
      'Answer a few questions and explore four website directions created around your business.',
  },

  landing: {
    heading: 'See Your Website Before We Build It.',
    paragraph:
      'Tell us about your business, choose the style and functions you need, and explore four custom website directions. Choose your favourite and let our team professionally build it.',
    primaryCta: 'Start Designing',
    benefits: [
      'No login required',
      'Upload your own logo',
      '4 custom directions',
      'Built professionally by our team',
    ],
    steps: [
      {
        step: '01',
        title: 'Tell us about your business',
        description: 'Share your goals, style preferences, and must-have features.',
      },
      {
        step: '02',
        title: 'Explore four directions',
        description: 'Review four distinct visual concepts shaped around your brief.',
      },
      {
        step: '03',
        title: 'Choose it. We build it.',
        description: 'Pick your favourite direction and hand it to our design team.',
      },
    ],
  },

  storageKey: 'wellmedia.designStudio.wizard.v1',

  generation: {
    conceptsPerProject: 4,
    maxBatchesPerProject: 1,
    promptVersion: DESIGN_STUDIO_PROMPT_VERSION,
  },

  uploads: {
    ...UPLOAD_LIMITS,
    acceptedFormatsLabel: 'JPG, PNG, WebP, or PDF (brand guide)',
    demoModeNote:
      'Files upload securely to your private project when the Design Studio API is available. Otherwise names are kept on this device only.',
  },

  pricing: {
    currency: 'ZAR' as const,
    staticWebsitePriceZar,
    /** Guide range shown in the wizard when an online shop is selected. */
    onlineShopFromZar,
    onlineShopToZar: websiteWithShopPriceZar,
    /** Payable amount used at checkout for website + shop packages. */
    websiteWithShopPriceZar,
    depositPercent: 100,
    customScopeRequiresQuote: true,
    generationLimitPerProject: 1,
  },

  preferredTimingOptions: [
    'As soon as possible',
    'Within 2 weeks',
    'Within a month',
    'Flexible / just exploring',
  ],

  wizardSteps: [
    { id: 'business', label: 'Business' },
    { id: 'goals', label: 'Goals' },
    { id: 'websiteType', label: 'Type' },
    { id: 'style', label: 'Style' },
    { id: 'colours', label: 'Colours' },
    { id: 'features', label: 'Features' },
    { id: 'pages', label: 'Pages' },
    { id: 'uploads', label: 'Uploads' },
    { id: 'brief', label: 'Brief' },
    { id: 'review', label: 'Review' },
  ],

  industries: [
    'Professional Services',
    'Retail',
    'E-commerce',
    'Hospitality',
    'Tourism',
    'Accommodation',
    'Restaurant / Food',
    'Construction',
    'Agriculture',
    'Legal',
    'Medical / Health',
    'Beauty / Wellness',
    'Real Estate',
    'Automotive',
    'Technology',
    'Non-profit / Ministry',
    'Creative / Media',
    'Other',
  ],

  goals: [
    'Generate leads',
    'Sell products',
    'Get bookings',
    'Showcase a portfolio',
    'Build trust and credibility',
    'Get WhatsApp enquiries',
    'Get phone calls',
    'Promote a physical location',
    'Educate customers',
    'Other',
  ],

  websiteTypes: [
    { value: 'Landing page', label: 'Landing page' },
    { value: 'Static business website', label: 'Static business website' },
    { value: 'Online store', label: 'Online store' },
    { value: 'Booking website', label: 'Booking website' },
    { value: 'Portfolio', label: 'Portfolio' },
    {
      value: 'Membership/client portal',
      label: 'Membership/client portal',
      note: 'Custom scope — final price confirmed by our team.',
    },
    {
      value: 'Custom web application',
      label: 'Custom web application',
      note: 'Custom scope — final price confirmed by our team.',
    },
  ],

  styles: [
    'Modern Luxury',
    'Clinical & Minimal',
    'Bold & Sales Focused',
    'Corporate & Professional',
    'Warm & Organic',
    'Dark & Cinematic',
    'Editorial',
    'Playful & Colourful',
    'Custom',
  ],

  colourModes: [
    'Use my logo colours',
    'Dark neutral',
    'Light neutral',
    'Navy & gold',
    'Earthy',
    'Pastel',
    'Bold high contrast',
    'Custom colours',
  ],

  features: [
    'Contact form',
    'WhatsApp',
    'Online shop',
    'PayFast payments',
    'Booking system',
    'Quote request',
    'Live price calculator',
    'Product catalogue',
    'Portfolio/gallery',
    'Before/after slider',
    'Video backgrounds',
    'Blog/news',
    'Testimonials',
    'Google Maps',
    'Newsletter signup',
    'Client portal',
    'Multi-language',
    'Other',
  ],

  suggestedPages: [
    'Home',
    'About',
    'Services',
    'Shop',
    'Products',
    'Portfolio',
    'Gallery',
    'Bookings',
    'FAQ',
    'Blog',
    'Contact',
  ],

  reviewDisclaimer:
    'Generated images are concept visuals. The final professional website may differ as our team refines layout, content, and brand details.',

  copy: {
    briefHeading: 'Tell us about your dream website',
    briefPlaceholder:
      'Example: We sell premium handmade furniture. I want the site to feel luxurious but minimal, with large product photography, an online shop, and a strong focus on interior designers and homeowners.',
    avoidLabel: 'Is there anything you definitely do not want?',
    generateCta: 'Generate My 4 Website Directions',
    resultsHeading: 'Your 4 Website Directions',
  },
} as const;

/** Phase 2 demo concepts — replaced by AI generation in later phases. */
export const demoConcepts: ConceptDirection[] = [
  {
    id: 'demo-01',
    name: 'Editorial Authority',
    oneLineConcept: 'Quiet luxury with magazine-style hierarchy and strong trust signals.',
    targetFeeling: ['Premium', 'Credible', 'Calm'],
    layoutDirection: 'Asymmetric editorial grid with generous whitespace',
    heroDirection: 'Full-bleed photography with restrained typography overlay',
    typographyDirection: 'Serif display + clean sans body',
    colourDirection: ['#0B1220', '#F5F1EA', '#C4A35A'],
    sectionFlow: ['Hero', 'Proof', 'Services', 'Work', 'CTA'],
    conversionStrategy: 'Primary consultation CTA above the fold; secondary WhatsApp path',
    visualPrompt: 'demo',
    differentiators: ['Editorial pacing', 'Trust-first proof strip', 'Soft gold accents'],
    mockAccent: 'from-[#1a2740] via-[#0b1220] to-[#061018]',
    mockPalette: ['#0B1220', '#F5F1EA', '#C4A35A'],
    bestFor: 'Professional services and high-trust brands',
  },
  {
    id: 'demo-02',
    name: 'Bold Conversion',
    oneLineConcept: 'Sales-led layout with clear offers, urgency, and direct enquiry paths.',
    targetFeeling: ['Energetic', 'Clear', 'Action-oriented'],
    layoutDirection: 'Stacked conversion sections with offer cards',
    heroDirection: 'Strong headline + dual CTAs + product/service visual',
    typographyDirection: 'Bold sans throughout with high contrast',
    colourDirection: ['#0A1628', '#1EA7FF', '#FFFFFF'],
    sectionFlow: ['Hero', 'Offer', 'Benefits', 'Testimonials', 'Contact'],
    conversionStrategy: 'Lead form and WhatsApp as equal primary actions',
    visualPrompt: 'demo',
    differentiators: ['Offer-first hero', 'Benefit bullets', 'Fast enquiry path'],
    mockAccent: 'from-[#0a2240] via-[#0c3a5c] to-[#061426]',
    mockPalette: ['#0A1628', '#1EA7FF', '#F8FAFC'],
    bestFor: 'Retail, campaigns, and lead-generation sites',
  },
  {
    id: 'demo-03',
    name: 'Warm Destination',
    oneLineConcept: 'Organic, welcoming atmosphere built for bookings and place-based brands.',
    targetFeeling: ['Warm', 'Inviting', 'Local'],
    layoutDirection: 'Image-forward storytelling with soft section rhythm',
    heroDirection: 'Atmospheric location imagery with simple booking CTA',
    typographyDirection: 'Friendly serif headings + readable sans',
    colourDirection: ['#1C1712', '#E8D5B5', '#7A8F6B'],
    sectionFlow: ['Hero', 'Experience', 'Gallery', 'Bookings', 'Map'],
    conversionStrategy: 'Booking CTA + WhatsApp for personal enquiries',
    visualPrompt: 'demo',
    differentiators: ['Place-led imagery', 'Soft earth palette', 'Booking focus'],
    mockAccent: 'from-[#2a2118] via-[#1c1712] to-[#12100e]',
    mockPalette: ['#1C1712', '#E8D5B5', '#7A8F6B'],
    bestFor: 'Hospitality, tourism, and accommodation',
  },
  {
    id: 'demo-04',
    name: 'Cinematic Showcase',
    oneLineConcept: 'Dark, immersive portfolio direction that puts craft and media first.',
    targetFeeling: ['Dramatic', 'Modern', 'Crafted'],
    layoutDirection: 'Full-bleed media grid with minimal chrome',
    heroDirection: 'Cinematic motion/still hero with sparse copy',
    typographyDirection: 'Minimal display type, lots of visual breathing room',
    colourDirection: ['#050A18', '#D9A441', '#94A3B8'],
    sectionFlow: ['Hero', 'Selected work', 'Process', 'About', 'Contact'],
    conversionStrategy: 'Soft CTA after portfolio immersion; contact for briefs',
    visualPrompt: 'demo',
    differentiators: ['Media-first grid', 'Dark cinematic base', 'Craft narrative'],
    mockAccent: 'from-[#050a18] via-[#0a1a2e] to-[#061426]',
    mockPalette: ['#050A18', '#D9A441', '#94A3B8'],
    bestFor: 'Creative studios, media brands, and portfolios',
  },
];

const demoValidation = validateConceptResponse({ concepts: demoConcepts });
if (!demoValidation.ok) {
  throw new Error(
    `demoConcepts failed schema validation: ${demoValidation.errors.join(' ')}`,
  );
}

export type DesignStudioConfig = typeof designStudioConfig;
