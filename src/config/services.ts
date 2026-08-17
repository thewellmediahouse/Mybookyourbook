/**
 * Services — The Well Media
 * Source: docs/TheWellMediaHouseWebsiteInputSpec.md
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
    id: 'content-creation',
    slug: 'content-creation',
    name: 'Content Creation',
    shortDescription: 'High-impact videos, photos, reels, product content, and brand visuals.',
    description:
      'High-impact video, photo, reel, product, and brand content created to capture attention, build trust, and tell the story of the business in a premium way.',
    benefits: [
      'Professional videos and visuals that elevate the brand.',
      'Content that captures attention and improves credibility.',
      'Product photography that helps sell products more effectively.',
      'Reels, brand films, and promotional videos that support marketing campaigns.',
      'Cinema-quality media that can be used across websites, social media, ads, and proposals.',
    ],
    image: '/images/product-photo.svg',
    imageAlt: 'Professional product photography setup',
    icon: 'marketing',
  },
  {
    id: 'content-management',
    slug: 'content-management',
    name: 'Content Management',
    shortDescription: 'Consistent posting, copywriting, page management, and campaign support.',
    description:
      'Consistent social media and digital content management designed to keep the brand visible, structured, and active with the right message and strategy.',
    benefits: [
      'Consistent posting and copywriting.',
      'Improved social media presence.',
      'Campaign support and ad management.',
      'Website content adjustments where included.',
      'Helps turn content into an organised system instead of random posts.',
    ],
    image: '/images/facebook-page.svg',
    imageAlt: 'Social media page management visual',
    icon: 'marketing',
  },
  {
    id: 'business-growth',
    slug: 'business-growth',
    name: 'Business Growth',
    shortDescription: 'Strategy, systems, revenue streams, events, and growth consulting.',
    description:
      'Growth strategy, business development, revenue stream planning, marketing structure, event support, and concept development focused on helping the business scale sustainably.',
    benefits: [
      'Clear growth strategy and direction.',
      'New product and revenue stream development.',
      'Marketing avenue planning.',
      'Event concepts, ticketing support, and growth campaigns.',
      'Better systems for bookings, sales, visibility, and long-term business growth.',
    ],
    image: '/images/business-growth.svg',
    imageAlt: 'Business growth chart and strategy visual',
    icon: 'strategy',
  },
  {
    id: 'starter-launch-pack',
    slug: 'starter-launch-pack',
    name: 'Starter / Launch Pack',
    shortDescription:
      'A powerful starting point for businesses that need brand, website, store, and media assets.',
    description:
      'A high-value launch package for businesses that need the core assets to start growing quickly, including brand assets, website, online store, promotional media, and professional photos.',
    benefits: [
      'Saves money compared with individual services.',
      'Gives the client a strong foundation quickly.',
      'Includes brand, website, shop, video, and photo assets.',
      'Ideal for businesses that want to launch or relaunch professionally.',
    ],
    image: '/images/cinema-camera.svg',
    imageAlt: 'Launch pack media and brand assets',
    icon: 'design',
  },
  {
    id: 'website-development',
    slug: 'website-development',
    name: 'Website Development & Digital Systems',
    shortDescription:
      'Modern websites, online stores, and digital systems that convert visitors into enquiries and sales.',
    description:
      'Modern websites, online stores, booking systems, digital structures, and online visibility tools designed to help businesses convert visitors into enquiries, bookings, and sales.',
    benefits: [
      'Professional online presence.',
      'Better customer experience.',
      'Online store and e-commerce setup.',
      'Booking and enquiry structure.',
      'Website systems that support business growth.',
    ],
    image: '/images/business-growth.svg',
    imageAlt: 'Website development and digital systems',
    icon: 'development',
  },
  {
    id: 'tourism-accommodation-marketing',
    slug: 'tourism-accommodation-marketing',
    name: 'Tourism & Accommodation Marketing',
    shortDescription:
      'Marketing and media for tourism businesses, lodges, resorts, and destination experiences.',
    description:
      'Marketing, media, and digital strategy for tourism businesses, lodges, resorts, guest houses, accommodation brands, and destination experiences.',
    benefits: [
      'Stronger visual storytelling.',
      'Better guest experience presentation.',
      'More enquiries and bookings.',
      'Destination-focused campaigns.',
      'Improved trust and perceived value.',
    ],
    image: '/images/tourism.svg',
    imageAlt: 'Tourism and accommodation marketing visual',
    icon: 'marketing',
  },
  {
    id: 'event-marketing',
    slug: 'event-marketing',
    name: 'Event Planning Support & Event Marketing',
    shortDescription: 'Event concepts, ticketing, media coverage, and promotional campaigns.',
    description:
      'Support for event concepts, ticketing, media coverage, promotional campaigns, event visibility, and post-event content.',
    benefits: [
      'Better event structure and promotion.',
      'Ticketing and campaign support.',
      'Premium event media.',
      'Clearer audience communication.',
      'Stronger post-event content and brand impact.',
    ],
    image: '/images/event.svg',
    imageAlt: 'Event coverage and marketing visual',
    icon: 'support',
  },
];

export type ServicesConfig = typeof servicesConfig;
