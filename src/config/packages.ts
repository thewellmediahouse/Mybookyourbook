/**
 * Packages and pricing — The Well Media
 * Source: docs/TheWellMediaHouseWebsiteInputSpec.md
 */
export type PackageTierIcon =
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'star'
  | 'spark'
  | 'crown'
  | 'rocket'
  | 'shield';

export interface PackageTier {
  id: string;
  name: string;
  price: string;
  period?: string;
  description?: string;
  features: string[];
  /** Icon key — maps to `designConfig.packages.tierIcons` */
  icon?: PackageTierIcon;
}

export type PackageAccentPreset = 'accent' | 'highlight' | 'cyan';

export type ServicePackageAccent =
  | PackageAccentPreset
  | {
      color: string;
      glow?: string;
      border?: string;
    };

export interface ServicePackages {
  serviceId: string;
  serviceName: string;
  /** Row label letter for pricing matrix (A, B, C) */
  categoryLetter?: string;
  /** Thumbnail image key under `raster.packages` */
  thumbnailKey?: 'videoProduction' | 'socialContent' | 'strategyGrowth';
  /** Short category summary for pricing page intro panels */
  summary?: string;
  /** Tier id to highlight as the recommended option for this service */
  recommendedTierId?: string;
  /** Per-service accent for prices, checks, and featured tier glow — preset or custom hex */
  accent?: ServicePackageAccent;
  tiers: PackageTier[];
}

export interface BundlePackage {
  id: string;
  name: string;
  price: string;
  savingsMessage?: string;
  features: string[];
}

export interface AlaCarteItem {
  /** Stable form value — auto-slugged from `item` when omitted */
  id?: string;
  item: string;
  price: string;
}

export interface TerminologyEntry {
  term: string;
  definition: string;
}

export interface TierSummary {
  tierId: string;
  name: string;
  label: string;
  tagline: string;
}

export const packagesConfig = {
  tierNames: {
    tier1: 'Silver',
    tier2: 'Gold',
    tier3: 'Platinum',
  },
  tierSummaries: [
    {
      tierId: 'tier1',
      name: 'Silver',
      label: 'Solid Foundation',
      tagline: 'For businesses that need essential structure, content, and visibility.',
    },
    {
      tierId: 'tier2',
      name: 'Gold',
      label: 'Stronger Growth',
      tagline: 'For businesses ready to build momentum and increase bookings.',
    },
    {
      tierId: 'tier3',
      name: 'Platinum',
      label: 'Maximum Impact',
      tagline: 'For businesses that want a full growth partner across media, management, and strategy.',
    },
  ] satisfies TierSummary[],
  pricingSelectorNote:
    "Not sure what you need? Book a consultation and we'll guide you.",
  servicePackages: [
    {
      serviceId: 'content-creation',
      serviceName: 'Content Creation',
      categoryLetter: 'A',
      thumbnailKey: 'videoProduction',
      summary: 'Premium videos, reels, product photos, and brand visuals.',
      recommendedTierId: 'content-gold',
      accent: 'highlight',
      tiers: [
        {
          id: 'content-silver',
          name: 'Silver',
          icon: 'silver',
          price: 'R5 000',
          period: 'pm',
          features: [
            '5 x Entry videos per month OR 2 x One set videos',
            '10 x product shoot and edit',
            '4 x posters or advert deals',
            'PS videos are no longer than 2 min',
          ],
        },
        {
          id: 'content-gold',
          name: 'Gold',
          icon: 'gold',
          price: 'R10 000',
          period: 'pm',
          features: [
            '8 x Entry videos per month OR 4 x One set videos',
            '1 x cinema Expert video / promo video',
            '15 x product shoot and edit',
            '10 x posters or advert deals',
            'PS videos are no longer than 2 min',
          ],
        },
        {
          id: 'content-platinum',
          name: 'Platinum',
          icon: 'platinum',
          price: 'R15 000',
          period: 'pm',
          features: [
            '12 x Entry videos per month OR 8 x One set videos',
            '2 x cinema Expert video / promo video',
            '30 x product shoot and edit',
            '15 x posters or advert deals',
            'PS videos are no longer than 2 min',
          ],
        },
      ],
    },
    {
      serviceId: 'content-management',
      serviceName: 'Content Management',
      categoryLetter: 'B',
      thumbnailKey: 'socialContent',
      summary: 'Structured posting, copywriting, campaign support, and social media consistency.',
      recommendedTierId: 'management-gold',
      accent: 'cyan',
      tiers: [
        {
          id: 'management-silver',
          name: 'Silver',
          icon: 'silver',
          price: 'R2 500',
          period: 'pm',
          features: [
            '2 x Social media platforms',
            '4 posts per month with copywriting, excluding media',
            '1 x consultation for social media growth',
            '1 x ad management up to R2 000',
          ],
        },
        {
          id: 'management-gold',
          name: 'Gold',
          icon: 'gold',
          price: 'R4 000',
          period: 'pm',
          features: [
            '3 x Social media platforms',
            '8 posts per month with copywriting, excluding media',
            '2 x consultation for social media growth',
            '1 x ad management up to R3 000',
            '2 x website management adjustments per month',
          ],
        },
        {
          id: 'management-platinum',
          name: 'Platinum',
          icon: 'platinum',
          price: 'R5 000',
          period: 'pm',
          features: [
            '4 x Social media platforms',
            '16 posts per month with copywriting, excluding media',
            '2 x consultation for social media growth',
            '1 x ad management up to R3 000',
            '4 x website management adjustments per month',
            '1 x full online shop management',
          ],
        },
      ],
    },
    {
      serviceId: 'business-growth',
      serviceName: 'Business Growth',
      categoryLetter: 'C',
      thumbnailKey: 'strategyGrowth',
      summary: 'Strategy, product development, revenue planning, marketing structure, and event support.',
      recommendedTierId: 'growth-gold',
      accent: 'accent',
      tiers: [
        {
          id: 'growth-silver',
          name: 'Silver',
          icon: 'silver',
          price: 'R3 000',
          period: 'pm',
          features: [
            '1 x product development',
            '2 x monthly growth strategy sessions',
            '1 x marketing avenue strategy session',
            '1 x event management, excludes paid marketing and ticketing',
            '1 x concept development',
            'Marketing structure drafting',
          ],
        },
        {
          id: 'growth-gold',
          name: 'Gold',
          icon: 'gold',
          price: 'R5 000',
          period: 'pm',
          features: [
            '2 x product development',
            '3 x monthly growth strategy sessions',
            '2 x marketing avenue strategy sessions',
            '2 x event management, excludes paid marketing and ticketing',
            '2 x concept development',
            '1 x marketing structure drafting',
          ],
        },
        {
          id: 'growth-platinum',
          name: 'Platinum',
          icon: 'platinum',
          price: 'R7 000',
          period: 'pm',
          features: [
            '4 x product development',
            '4 x monthly growth strategy sessions',
            '3 x marketing avenue strategy sessions',
            '3 x event management, excludes paid marketing and ticketing',
            '3 x concept development',
            '2 x marketing structure drafting',
          ],
        },
      ],
    },
  ] as ServicePackages[],
  bundles: [
    {
      id: 'launch-pack',
      name: 'Launch Pack',
      price: 'R25 000',
      savingsMessage: 'Save R15 000 compared with selected individual services',
      features: [
        'Logo design & email signature',
        'Website',
        'Online store',
        'Product promo video',
        'Cinema video of company',
        '10 product photos',
        '5 business portfolio photos',
      ],
    },
  ] as BundlePackage[],
  alaCarte: [
    { item: 'Website development alone, 4 page website', price: 'R7 000' },
    { item: 'Online shop with 20 product shoot', price: 'R10 000' },
    { item: 'Both website and online shop', price: 'R15 000' },
    { item: 'Logo design', price: 'R1 000' },
    { item: 'Email signature', price: 'R500' },
    { item: 'Email domain setup', price: 'R500' },
    { item: 'Product promotional video', price: 'R5 000' },
    { item: 'Product photography', price: 'R300 per image' },
    { item: 'Professional business portraits', price: 'R300 per photo' },
    { item: 'Cinematic company promo video', price: 'R10 000' },
  ],
  terminology: [
    {
      term: 'Entry Video',
      definition:
        'Stock footage-based video. High-quality stock footage edited into engaging and affordable short-form video content.',
    },
    {
      term: 'One Set Video',
      definition:
        'Podcast-type, talking-head, or one-scene reel filmed in a single setup with clean audio, lighting, and professional editing.',
    },
    {
      term: 'Expert Video',
      definition:
        'Multi-location cinema video with multiple angles, premium footage, drone footage where applicable, and a more cinematic production approach.',
    },
  ],
} as const;

/** Flat list of package interest options for contact form selects */
export function getPackageInterestOptions(): { value: string; label: string }[] {
  const tierOptions = packagesConfig.tierSummaries.map((t) => ({
    value: t.name,
    label: t.name,
  }));
  const bundleOptions = packagesConfig.bundles.map((bundle) => ({
    value: bundle.id,
    label: bundle.name,
  }));
  return [
    ...tierOptions,
    ...bundleOptions,
    { value: 'custom', label: 'Custom' },
    { value: 'not-sure', label: 'Not Sure Yet' },
  ];
}

function alaCarteItemId(entry: AlaCarteItem, index: number): string {
  if (entry.id) return entry.id;
  const slug = entry.item
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || `ala-carte-${index + 1}`;
}

/** Flat list of à la carte options for contact form selects */
export function getAlaCarteInterestOptions(): { value: string; label: string }[] {
  return [
    ...packagesConfig.alaCarte.map((entry, index) => ({
      value: alaCarteItemId(entry, index),
      label: `${entry.item} — ${entry.price}`,
    })),
    { value: 'not-sure', label: 'Not Sure Yet' },
  ];
}

export type PackagesConfig = typeof packagesConfig;
