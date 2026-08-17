/**
 * Google Merchant Center product feed rows — derived from package configs.
 * Served at /feeds/google-merchant.tsv for scheduled fetch.
 */
import { packagesConfig } from '@/config/packages';
import { professionalServicesPackagesConfig } from '@/config/professionalServices';
import { siteConfig } from '@/config/site';
import { getSiteUrl } from '@/utils/site-url';

export const MERCHANT_FEED_HEADERS = [
  'id',
  'title',
  'description',
  'link',
  'image_link',
  'additional_image_link',
  'availability',
  'price',
  'brand',
  'condition',
  'identifier_exists',
  'google_product_category',
  'product_type',
  'custom_label_0',
  'custom_label_1',
  'custom_label_2',
  'shipping',
] as const;

export type MerchantFeedHeader = (typeof MERCHANT_FEED_HEADERS)[number];

export type MerchantFeedRow = Record<MerchantFeedHeader, string>;

const GOOGLE_PRODUCT_CATEGORY = 'Business & Industrial > Advertising & Marketing';
const PRODUCT_TYPE = 'Media & Marketing Services';

/** Convert display prices like "R25 000" or "R5 000" to Merchant format. */
export function toMerchantPrice(displayPrice: string): string | null {
  const cleaned = displayPrice
    .replace(/R/gi, '')
    .replace(/\s/g, '')
    .replace(/,/g, '')
    .trim();

  // Skip open-ended / per-unit pricing (not valid for Merchant fixed price)
  if (!cleaned || /per|\/|from|\+/i.test(displayPrice)) return null;

  const amount = Number.parseFloat(cleaned);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  return `${amount.toFixed(2)} ZAR`;
}

function escapeTsv(value: string): string {
  return value.replace(/\t/g, ' ').replace(/\r?\n/g, ' ').trim();
}

function product(partial: Omit<MerchantFeedRow, 'image_link' | 'additional_image_link' | 'availability' | 'brand' | 'condition' | 'identifier_exists' | 'google_product_category' | 'product_type' | 'shipping'> & Partial<MerchantFeedRow>, siteUrl: string): MerchantFeedRow {
  return {
    image_link: `${siteUrl}/assets/the-well/og-default.jpg`,
    additional_image_link: `${siteUrl}/assets/the-well/logos/android-chrome-512x512.png`,
    availability: 'in_stock',
    brand: siteConfig.name,
    condition: 'new',
    identifier_exists: 'no',
    google_product_category: GOOGLE_PRODUCT_CATEGORY,
    product_type: PRODUCT_TYPE,
    shipping: 'ZA:::0.00 ZAR',
    ...partial,
  };
}

function featuresDescription(intro: string, features: readonly string[]): string {
  const list = features.filter(Boolean).join('. ');
  return `${intro} Includes: ${list}.`;
}

export function buildMerchantFeedProducts(site?: URL | string | null): MerchantFeedRow[] {
  const siteUrl = getSiteUrl(site);
  const rows: MerchantFeedRow[] = [];

  for (const bundle of packagesConfig.bundles) {
    const price = toMerchantPrice(bundle.price);
    if (!price) continue;
    rows.push(
      product(
        {
          id: `twm-${bundle.id}`,
          title: `${bundle.name} — Website, Online Store & Premium Media Bundle`,
          description: featuresDescription(
            `Complete business launch foundation from ${siteConfig.name}.`,
            bundle.features,
          ),
          link: `${siteUrl}/pricing`,
          price,
          custom_label_0: 'once-off',
          custom_label_1: 'launch-pack',
          custom_label_2: 'business',
        },
        siteUrl,
      ),
    );
  }

  for (const bundle of professionalServicesPackagesConfig.bundles) {
    const price = toMerchantPrice(bundle.price);
    if (!price) continue;
    rows.push(
      product(
        {
          id: `twm-${bundle.id}`,
          title: `${bundle.name} — Website, Consultation System & Media`,
          description: featuresDescription(
            `Professional practice foundation package from ${siteConfig.name}.`,
            bundle.features,
          ),
          link: `${siteUrl}/pricing/professional-services`,
          price,
          custom_label_0: 'once-off',
          custom_label_1: 'launch-pack',
          custom_label_2: 'professional-services',
        },
        siteUrl,
      ),
    );
  }

  // Fixed-price à la carte — skip per-unit items
  const alaCarteMeta: Record<string, { id: string; title: string; label: string }> = {
    'Website development alone, 4 page website': {
      id: 'twm-website-4-page',
      title: '4-Page Professional Website Development',
      label: 'website',
    },
    'Online shop with 20 product shoot': {
      id: 'twm-online-shop-20-shoot',
      title: 'Online Shop Setup with 20 Product Photos',
      label: 'online-shop',
    },
    'Both website and online shop': {
      id: 'twm-website-and-shop',
      title: 'Website and Online Shop Package',
      label: 'website-shop',
    },
    'Logo design': {
      id: 'twm-logo-design',
      title: 'Professional Logo Design',
      label: 'branding',
    },
    'Email signature': {
      id: 'twm-email-signature',
      title: 'Branded Email Signature Design',
      label: 'branding',
    },
    'Email domain setup': {
      id: 'twm-email-domain-setup',
      title: 'Email Domain Setup',
      label: 'setup',
    },
    'Product promotional video': {
      id: 'twm-product-promo-video',
      title: 'Product Promotional Video',
      label: 'video',
    },
    'Cinematic company promo video': {
      id: 'twm-cinematic-company-promo',
      title: 'Cinematic Company Promo Video',
      label: 'video',
    },
  };

  for (const entry of packagesConfig.alaCarte) {
    const meta = alaCarteMeta[entry.item];
    const price = toMerchantPrice(entry.price);
    if (!meta || !price) continue;
    rows.push(
      product(
        {
          id: meta.id,
          title: meta.title,
          description: `${entry.item} from ${siteConfig.name}. Price: ${entry.price}.`,
          link: `${siteUrl}/pricing`,
          price,
          custom_label_0: 'once-off',
          custom_label_1: 'ala-carte',
          custom_label_2: meta.label,
        },
        siteUrl,
      ),
    );
  }

  // Packaged photo SKUs (Merchant needs fixed price; config is per-image)
  rows.push(
    product(
      {
        id: 'twm-product-photo-pack-10',
        title: 'Product Photography Pack — 10 Images',
        description: `Professional product photography pack of 10 edited images from ${siteConfig.name} for websites, online shops, and marketing.`,
        link: `${siteUrl}/pricing`,
        price: '3000.00 ZAR',
        custom_label_0: 'once-off',
        custom_label_1: 'ala-carte',
        custom_label_2: 'photography',
      },
      siteUrl,
    ),
    product(
      {
        id: 'twm-business-portrait-pack-5',
        title: 'Professional Business Portrait Pack — 5 Photos',
        description: `Professional business portrait pack of 5 edited photos from ${siteConfig.name} for websites, proposals, and brand profiles.`,
        link: `${siteUrl}/pricing`,
        price: '1500.00 ZAR',
        custom_label_0: 'once-off',
        custom_label_1: 'ala-carte',
        custom_label_2: 'photography',
      },
      siteUrl,
    ),
  );

  for (const service of packagesConfig.servicePackages) {
    for (const tier of service.tiers) {
      const price = toMerchantPrice(tier.price);
      if (!price) continue;
      rows.push(
        product(
          {
            id: `twm-${tier.id}`,
            title: `${service.serviceName} Retainer — ${tier.name} (Monthly)`,
            description: featuresDescription(
              `Monthly ${service.serviceName.toLowerCase()} retainer from ${siteConfig.name}.`,
              tier.features,
            ),
            link: `${siteUrl}/pricing`,
            price,
            custom_label_0: 'monthly',
            custom_label_1: service.serviceId,
            custom_label_2: tier.name,
          },
          siteUrl,
        ),
      );
    }
  }

  for (const service of professionalServicesPackagesConfig.servicePackages) {
    for (const tier of service.tiers) {
      const price = toMerchantPrice(tier.price);
      if (!price) continue;
      rows.push(
        product(
          {
            id: `twm-ps-${tier.id.replace(/^ps-/, '')}`,
            title: `Professional ${service.serviceName} — ${tier.name} (Monthly)`,
            description: featuresDescription(
              `Monthly professional ${service.serviceName.toLowerCase()} retainer from ${siteConfig.name}.`,
              tier.features,
            ),
            link: `${siteUrl}/pricing/professional-services`,
            price,
            custom_label_0: 'monthly',
            custom_label_1: 'professional-services',
            custom_label_2: tier.name,
          },
          siteUrl,
        ),
      );
    }
  }

  return rows;
}

export function buildMerchantFeedTsv(site?: URL | string | null): string {
  const rows = buildMerchantFeedProducts(site);
  const lines = [
    MERCHANT_FEED_HEADERS.join('\t'),
    ...rows.map((row) =>
      MERCHANT_FEED_HEADERS.map((header) => escapeTsv(row[header] ?? '')).join('\t'),
    ),
  ];
  return `${lines.join('\n')}\n`;
}
