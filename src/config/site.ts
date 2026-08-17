/**
 * Core site settings — The Well Media
 * Source: docs/TheWellMediaHouseWebsiteInputSpec.md
 */
export const siteConfig = {
  name: 'The Well Media',
  url: 'https://thewellmedia.com',
  industry: 'Business Growth Partner',
  positioning: 'PREMIUM MEDIA. STRATEGIC GROWTH.',
  tagline: 'We Create. You Grow.',
  supportingTaglines: [
    'More Than Marketing. Real Business Growth.',
    'Create. Connect. Grow.',
    'Premium media, smart strategy, and business growth systems.',
    'We help businesses get seen, get booked, and grow sustainably.',
  ],
  shortDescription:
    'The Well Media is a premium media and business growth partner that helps businesses increase visibility, generate enquiries, improve bookings and sales, and build sustainable growth systems through strategy, media production, content management, websites, and consulting.',
  longDescription:
    'The Well Media is not positioned as a standard social media marketing agency. We are a Business Growth Partner that helps businesses establish systems, develop revenue streams, create brand awareness, increase bookings and sales, and grow with clarity and structure. We combine strategy, business development, premium media production, website development, content creation, content management, tourism marketing, accommodation marketing, event planning support, and growth consulting into one integrated partnership.',
  language: 'en',
  locale: 'en-ZA',
  author: 'The Well Media',
  defaultOgImage: '/assets/the-well/og-default.jpg',
  defaultOgImageAlt:
    'The Well Media — Premium Media. Business Growth. Create. Connect. Grow.',
  branding: {
    primary: '#061426',
    secondary: '#020814',
    accent: '#D9A441',
    additionalAccent: '#1EA7FF',
    preferredStyle: 'Luxury, modern, cinematic, premium',
    themeMode: 'dark' as 'light' | 'dark' | 'auto',
    neutrals: {
      text: '#FFFFFF',
      textMuted: '#94A3B8',
      background: '#061426',
      backgroundDeep: '#050A18',
      border: 'rgba(217, 164, 65, 0.22)',
    },
  },
  designRules: [
    'Keep the design modern but simple.',
    'Use generous padding between sections; avoid overcrowding pages.',
    'Use fewer visual blocks on the About page.',
    'Use rounded corners on cards, media blocks, buttons, forms, and image containers.',
    'Use plan names Silver, Gold, and Platinum only.',
  ],
} as const;

export type SiteConfig = typeof siteConfig;
