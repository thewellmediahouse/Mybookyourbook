/**
 * Services — maps to SITE_SPEC (docs/SITE_SPEC.schema.json) "Services" section.
 */
export interface Service {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  benefits: string[];
  image?: string;
  imageAlt?: string;
  icon?: 'strategy' | 'design' | 'development' | 'marketing' | 'support';
}

export const servicesConfig: Service[] = [
  {
    id: 'strategy',
    slug: 'business-strategy',
    name: 'Business Strategy',
    shortDescription:
      'Clarify positioning, messaging, and priorities so your team can execute with confidence.',
    description:
      'Clarify positioning, messaging, and priorities so your team can execute with confidence.',
    benefits: [
      'Market and competitor research',
      'Customer persona development',
      'Actionable roadmap and KPIs',
    ],
    icon: 'strategy',
  },
  {
    id: 'design',
    slug: 'brand-design',
    name: 'Brand & Design',
    shortDescription:
      'Create a cohesive visual identity and user experience that builds trust from the first visit.',
    description:
      'Create a cohesive visual identity and user experience that builds trust from the first visit.',
    benefits: [
      'Logo and brand guidelines',
      'Website and landing page design',
      'Conversion-focused UX patterns',
    ],
    icon: 'design',
  },
  {
    id: 'development',
    slug: 'web-development',
    name: 'Web Development',
    shortDescription: 'Ship fast, accessible, SEO-friendly sites built on modern static tooling.',
    description: 'Ship fast, accessible, SEO-friendly sites built on modern static tooling.',
    benefits: [
      'Performance-optimized builds',
      'Mobile-first responsive layouts',
      'Easy content updates for your team',
    ],
    icon: 'development',
  },
];

export type ServicesConfig = typeof servicesConfig;
