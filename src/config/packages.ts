/**
 * Packages and pricing — maps to NEW_WEBSITE_INPUT_SPEC "Packages and Pricing".
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
  /** Global tier names used across selectors, forms, and pricing tables */
  tierNames: {
    tier1: 'Starter',
    tier2: 'Pro',
    tier3: 'Enterprise',
  },
  tierSummaries: [
    {
      tierId: 'tier1',
      name: 'Starter',
      label: 'Starter',
      tagline: 'Essentials to get moving',
    },
    {
      tierId: 'tier2',
      name: 'Pro',
      label: 'Pro',
      tagline: 'Most popular for growing teams',
    },
    {
      tierId: 'tier3',
      name: 'Enterprise',
      label: 'Enterprise',
      tagline: 'Full partnership and priority support',
    },
  ] satisfies TierSummary[],
  pricingSelectorNote:
    'Not sure what you need? Book a consultation and we will guide you.',
  servicePackages: [] as ServicePackages[],
  bundles: [] as BundlePackage[],
  alaCarte: [] as AlaCarteItem[],
  terminology: [] as TerminologyEntry[],
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
