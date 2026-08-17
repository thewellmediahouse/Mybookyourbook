/**
 * Company contact and social details — The Well Media
 * Source: docs/TheWellMediaHouseWebsiteInputSpec.md
 */
export const companyConfig = {
  email: 'schalk@thewellmedia.com',
  phone: '082 554 8983',
  officeHours: 'Monday – Friday, 9:00 AM – 5:00 PM',
  /** Regions where we actively take on client work */
  serviceAreas: ['Eastern Cape', 'Gauteng', 'Cape Town'] as const,
  footerBrandStatement:
    'We create content and growth systems that help businesses be seen, get booked, and grow sustainably.',
  messaging: {
    provider: 'whatsapp' as 'whatsapp' | 'telegram' | null,
    link: 'https://wa.me/27825548983',
    label: 'Chat on WhatsApp',
    ariaLabel: 'Chat with The Well Media on WhatsApp',
  },
  address: {
    street: '',
    city: '',
    region: 'Eastern Cape',
    country: 'South Africa',
    postalCode: '',
  },
  social: {
    linkedin: '',
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    tiktok: '',
  },
  targetAudience:
    'South African small businesses, growing brands, tourism businesses, accommodation providers, lodges, resorts, guest houses, local service providers, product-based businesses, event organisers, restaurants, hospitality businesses, ministries, and entrepreneurs who need more than basic marketing.',
  differentiators: [
    'Business Growth Partner — not just a social media marketer',
    'Strategy, media, websites, content, and business development under one partnership',
    'Focus on visibility, bookings, sales, systems, and long-term revenue growth',
    'Premium cinema-quality media production',
    'Phased implementation so clients do not need to launch everything at once',
    'Help create revenue streams, offers, campaigns, and growth structures',
  ],
} as const;

export type CompanyConfig = typeof companyConfig;

export function formatAddress(): string {
  const { city, region, country } = companyConfig.address;
  const parts = [city, region, country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : country;
}

/** Client-facing service area line — e.g. "Serving Eastern Cape, Gauteng & Cape Town" */
export function formatServiceAreas(): string {
  const areas = companyConfig.serviceAreas;
  if (areas.length === 0) return formatAddress();
  if (areas.length === 1) return `Serving ${areas[0]}`;
  const last = areas[areas.length - 1];
  const rest = areas.slice(0, -1);
  return `Serving ${rest.join(', ')} & ${last}`;
}

/** @deprecated Use differentiators — kept for backward compatibility */
export const uniqueSellingPoints = companyConfig.differentiators;
