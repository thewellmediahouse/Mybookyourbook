/**
 * Core site settings — maps to NEW_WEBSITE_INPUT_SPEC "Website Information" and "Branding".
 */
export const siteConfig = {
  name: 'Acme Business Solutions',
  url: 'https://example.com',
  industry: 'Professional Services',
  positioning: 'Growth Partner',
  tagline: 'Helping businesses grow with clarity and confidence',
  supportingTaglines: [
    'Strategy that moves the needle',
    'Design that builds trust',
    'Technology that scales with you',
  ],
  shortDescription:
    'We partner with small and mid-size businesses to deliver practical strategy, design, and technology.',
  longDescription:
    'Acme Business Solutions is a full-service consultancy focused on outcomes that matter. From brand positioning to digital experiences, we help teams move faster with less friction. Our approach blends research, craftsmanship, and measurable results so you can focus on running your business.',
  language: 'en',
  locale: 'en-US',
  author: 'Acme Business Solutions',
  defaultOgImage: '/og-default.svg',
  defaultOgImageAlt: 'Acme Business Solutions',
  branding: {
    primary: '#1e40af',
    secondary: '#0f766e',
    accent: '#f59e0b',
    additionalAccent: '#0ea5e9',
    preferredStyle: 'Modern',
    themeMode: 'light' as 'light' | 'dark' | 'auto',
    neutrals: {
      text: '#0f172a',
      textMuted: '#64748b',
      background: '#f8fafc',
      backgroundDeep: '#020617',
      border: '#e2e8f0',
    },
  },
  designRules: [
    'Use generous padding between sections; avoid overcrowding pages.',
    'Prefer real photography over excessive iconography.',
    'Use rounded corners on cards, media blocks, buttons, and forms.',
  ],
} as const;

export type SiteConfig = typeof siteConfig;
