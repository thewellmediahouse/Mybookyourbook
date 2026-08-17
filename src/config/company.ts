/**
 * Company contact and social details — maps to SITE_SPEC `company` (docs/SITE_SPEC.schema.json).
 */
export const companyConfig = {
  email: 'hello@example.com',
  phone: '+1 (555) 123-4567',
  officeHours: 'Monday–Friday, 9:00 AM – 5:00 PM',
  footerBrandStatement:
    'We partner with growing businesses to deliver practical strategy, design, and technology.',
  messaging: {
    provider: null as 'whatsapp' | 'telegram' | null,
    link: '',
    label: '',
    ariaLabel: '',
  },
  address: {
    street: '123 Market Street, Suite 400',
    city: 'San Francisco',
    region: 'CA',
    country: 'United States',
    postalCode: '94105',
  },
  social: {
    linkedin: 'https://linkedin.com/company/example',
    facebook: 'https://facebook.com/example',
    instagram: 'https://instagram.com/example',
    twitter: 'https://x.com/example',
    youtube: 'https://youtube.com/@example',
    tiktok: '',
  },
  targetAudience:
    'Founders and operators at growing companies who need a reliable partner for brand, web, and go-to-market work without hiring a full in-house team.',
  differentiators: [
    'Senior-led engagements on every project',
    'Fixed-scope packages with transparent pricing',
    'Launch-ready deliverables in weeks, not months',
    'Ongoing support after go-live',
  ],
} as const;

export type CompanyConfig = typeof companyConfig;

export function formatAddress(): string {
  const { street, city, region, postalCode, country } = companyConfig.address;
  return [street, [city, region, postalCode].filter(Boolean).join(' '), country]
    .filter(Boolean)
    .join(', ');
}

/** Embeddable Google Maps URL for the company address (no API key). */
export function googleMapsEmbedUrl(zoom = 15): string {
  const q = encodeURIComponent(formatAddress());
  return `https://maps.google.com/maps?q=${q}&z=${zoom}&hl=en&ie=UTF8&output=embed`;
}

/** Open-in-Maps link for the company address. */
export function googleMapsLinkUrl(): string {
  const q = encodeURIComponent(formatAddress());
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

/** @deprecated Use differentiators — kept for backward compatibility */
export const uniqueSellingPoints = companyConfig.differentiators;
