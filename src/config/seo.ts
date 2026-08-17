/**
 * SEO configuration — The Well Media
 * Source: docs/TheWellMediaHouseWebsiteInputSpec.md
 */
export const seoConfig = {
  city: 'Jeffreys Bay',
  region: 'Eastern Cape',
  country: 'South Africa',
  primaryKeywords: [
    'business growth agency South Africa',
    'media production company South Africa',
    'content creation agency South Africa',
    'website development for small businesses',
    'social media management South Africa',
    'marketing strategy for small businesses',
    'tourism marketing South Africa',
    'accommodation marketing South Africa',
    'business growth partner',
  ],
  secondaryKeywords: [
    'video production for businesses',
    'product photography South Africa',
    'media production Gauteng',
    'media production Cape Town',
    'business growth consulting',
    'social media content management',
    'online store setup South Africa',
    'event marketing support',
    'brand awareness strategy',
    'booking and sales growth',
    'premium media production',
    'digital marketing systems',
  ],
  titleSuffix: 'The Well Media',
  twitterHandle: '',
  pages: {
    home: {
      title: 'The Well Media | Business Growth, Media Production & Marketing Strategy',
      description:
        'The Well Media helps businesses grow through premium media production, content creation, website development, marketing strategy, and business growth systems.',
    },
    about: {
      title: 'About The Well Media | Your Business Growth Partner',
      description:
        'Learn how The Well Media helps businesses build systems, create demand, improve visibility, increase bookings and sales, and grow sustainably.',
    },
    portfolio: {
      title: 'Our Work | The Well Media Portfolio',
      description:
        'Explore The Well Media projects across brand videos, product photography, social media management, tourism campaigns, events, and business growth campaigns.',
    },
    contact: {
      title: 'Contact The Well Media | Book a Business Growth Consultation',
      description:
        'Contact The Well Media to book a consultation. We serve clients across Eastern Cape, Gauteng, and Cape Town with premium media, websites, strategy, and growth systems.',
    },
    services: {
      title: 'Services | The Well Media',
      description:
        'Explore content creation, content management, business growth, website development, tourism marketing, event marketing, and launch packages from The Well Media.',
    },
    pricing: {
      title: 'Packages & Pricing | The Well Media',
      description:
        'Launch Pack, monthly growth support, and once-off services from The Well Media — premium media, strategy, and business growth packages for South African businesses.',
    },
    professionalServices: {
      title: 'Professional Services Pricing | The Well Media',
      description:
        'Professional Practice Launch Pack and Silver, Gold and Platinum retainers for consultants, practices and professional service providers — websites, consultation systems and premium media.',
    },
    faq: {
      title: 'FAQ | The Well Media',
      description:
        'Common questions about consultations, services, packages, and how The Well Media helps businesses grow.',
    },
    designYourWebsite: {
      title: 'Design Your Website | The Well Media',
      description:
        'See your website before we build it. Answer a few questions, explore four custom directions, and let The Well Media professionally build your favourite.',
    },
    designYourWebsiteCreate: {
      title: 'Create Your Website Direction | The Well Media',
      description:
        'Guided brief for Design Your Website — tell us about your business, style, and features. No login required.',
    },
    designYourWebsiteResults: {
      title: 'Your 4 Website Directions | The Well Media',
      description:
        'Compare four website concept directions created around your brief. Choose a favourite for The Well Media to build professionally.',
    },
    designYourWebsiteContact: {
      title: 'Confirm Your Website Project | The Well Media',
      description:
        'Share your contact details and confirm pricing for the website direction you selected with The Well Media.',
    },
    designYourWebsitePaymentSuccess: {
      title: 'Payment Received | The Well Media',
      description:
        'Your website direction, brief, and payment details have been received by The Well Media House.',
    },
    designYourWebsitePaymentCancel: {
      title: 'Payment Cancelled | The Well Media',
      description:
        'Your PayFast payment was cancelled. You can return to checkout and try again when ready.',
    },
    designYourWebsiteInternal: {
      title: 'Design Studio Internal | The Well Media',
      description: 'Internal Design Studio project handoff retrieval for The Well Media team.',
    },
  },
} as const;

export type SeoConfig = typeof seoConfig;
