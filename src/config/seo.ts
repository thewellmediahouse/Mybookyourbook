/**
 * SEO configuration — maps to NEW_WEBSITE_INPUT_SPEC "SEO" section.
 */
export const seoConfig = {
  /** {{city}} */
  city: 'San Francisco',
  /** {{region}} */
  region: 'California',
  /** {{country}} */
  country: 'United States',
  primaryKeywords: [
    'business consulting',
    'digital strategy',
    'professional services',
  ],
  secondaryKeywords: [
    'brand development',
    'web design agency',
    'small business marketing',
  ],
  /** Default title suffix appended to page titles */
  titleSuffix: 'Acme Business Solutions',
  /** Twitter handle without @ — leave empty if not used */
  twitterHandle: 'example',
  pages: {
    home: {
      title: 'Acme Business Solutions | Strategy, Design & Technology',
      description:
        'Acme Business Solutions partners with growing businesses to deliver practical strategy, design, and technology.',
    },
    about: {
      title: 'About Acme Business Solutions | Your Growth Partner',
      description:
        'Learn how Acme Business Solutions helps teams clarify positioning, build trust, and grow with clarity and confidence.',
    },
    portfolio: {
      title: 'Our Work | Acme Business Solutions Portfolio',
      description:
        'Explore selected projects across strategy, design, and development from Acme Business Solutions.',
    },
    contact: {
      title: 'Contact Acme Business Solutions | Book a Consultation',
      description:
        'Contact Acme Business Solutions to discuss your goals and get a clear recommendation for your next step.',
    },
    services: {
      title: 'Services | Acme Business Solutions',
      description:
        'Explore business strategy, brand and design, web development, and ongoing support from Acme Business Solutions.',
    },
    faq: {
      title: 'FAQ | Acme Business Solutions',
      description:
        'Common questions about working with Acme Business Solutions, timelines, and how we help businesses grow.',
    },
  },
} as const;

export type SeoConfig = typeof seoConfig;
