/**
 * Portfolio — The Well Media
 * Source: docs/TheWellMediaHouseWebsiteInputSpec.md
 */
import type { ImageMetadata } from 'astro';
import { raster } from '@/assets/raster';

const portfolioVideoThumbnails = {
  simolaHotel: raster.portfolio.thumbs.simolaHotel,
  simolaPadel: raster.portfolio.thumbs.simolaPadel,
  simolaDining: raster.portfolio.thumbs.simolaDining,
  conradLight: raster.portfolio.thumbs.conradLight,
} as const;
export interface PortfolioMediaImage {
  src: ImageMetadata | string;
  alt: string;
  caption?: string;
}

export interface PortfolioMediaVideo {
  thumbnail?: ImageMetadata | string;
  thumbnailAlt: string;
  url?: string;
  title?: string;
  caption?: string;
}

export interface PortfolioTestimonial {
  quote: string;
  author: string;
  role: string;
  company?: string;
}

export interface PortfolioDetailMeta {
  client?: string;
  services?: string[];
  year?: string;
}

export interface PortfolioDetail {
  summary?: string;
  meta?: PortfolioDetailMeta;
  testimonial?: PortfolioTestimonial;
  videos?: PortfolioMediaVideo[];
  images?: PortfolioMediaImage[];
}

export interface PortfolioItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  image: ImageMetadata | string;
  imageAlt: string;
  isVideo?: boolean;
  detail?: PortfolioDetail;
}

export interface PortfolioCategory {
  id: string;
  label: string;
}

export const portfolioConfig = {
  pageTitle: 'Our Work',
  categories: [
    { id: 'all', label: 'All' },
    { id: 'videos', label: 'Videos' },
    { id: 'facebook-pages', label: 'Facebook Pages Managed' },
    { id: 'product-photography', label: 'Product Photography' },
    { id: 'client-meetings', label: 'Client Meetings' },
    { id: 'tourism-accommodation', label: 'Tourism & Accommodation' },
    { id: 'events', label: 'Events' },
    { id: 'business-growth', label: 'Business Growth' },
  ] satisfies PortfolioCategory[],
  items: [
    {
      id: 'brand-film',
      slug: 'brand-film',
      title: 'Brand Film',
      category: 'videos',
      description: 'Cinematic storytelling that builds brand identity.',
      image: portfolioVideoThumbnails.simolaHotel,
      imageAlt: 'Simola Hotel luxury stay experience',
      isVideo: false,
      detail: {
        summary:
          'A cinematic brand film crafted to communicate purpose, quality, and trust — designed for website hero placement, social campaigns, and sales conversations.',
        meta: {
          client: 'Regional hospitality group',
          services: ['Brand film production', 'Creative direction', 'Post-production'],
          year: '2025',
        },
        videos: [
          {
            url: 'https://youtu.be/WrDJoxajjhw',
            thumbnail: portfolioVideoThumbnails.simolaHotel,
            thumbnailAlt: 'Simola Hotel luxury stay experience video thumbnail',
            title: 'Simola Hotel — Luxury Stay Experience',
            caption: 'Cinematic hotel showcase for web, social, and campaigns.',
          },
          {
            url: 'https://youtu.be/PupfGZICfzM',
            thumbnail: portfolioVideoThumbnails.simolaPadel,
            thumbnailAlt: 'Simola Padel Courts video thumbnail',
            title: 'Simola Padel Courts',
            caption: 'Premium padel court showcase — play, compete, belong.',
          },
          {
            url: 'https://youtu.be/iPZ9k3XLx4Y',
            thumbnail: portfolioVideoThumbnails.simolaDining,
            thumbnailAlt: 'Simola Dining luxury food experience video thumbnail',
            title: 'Simola Dining — Luxury Food Experience',
            caption: 'Fine dining film highlighting Simola’s culinary experience.',
          },
        ],
        images: [
          {
            src: raster.portfolio.simolaRestaurant.one,
            alt: 'Cinema camera on location',
            caption: 'Premium production setup on location.',
          },
          {
            src: raster.portfolio.simolaRestaurant.two,
            alt: 'Brand film still frame',
            caption: 'Still frame from the final edit.',
          },
          {
            src: raster.portfolio.simolaRestaurant.three,
            alt: 'Brand film still frame',
            caption: 'Still frame from the final edit.',
          },
          {
            src: raster.portfolio.simolaRestaurant.four,
            alt: 'Brand film still frame',
            caption: 'Still frame from the final edit.',
          },
        ],
        testimonial: {
          quote:
            'The brand film finally showed who we are — not just what we sell. Enquiries from the website increased within weeks of launch.',
          author: 'Sarah M.',
          role: 'Marketing Director',
          company: 'Coastal hospitality group',
        },
      },
    },
    {
      id: 'conrad-light',
      slug: 'conrad-light',
      title: 'Conrad Light Music Video',
      category: 'videos',
      description: 'Music video production for Conrad Light.',
      image: portfolioVideoThumbnails.conradLight,
      imageAlt: 'Conrad Light — Fade With Me music video',
      isVideo: true,
      detail: {
        summary: 'Music video production showcasing Conrad Light with cinematic visuals and premium editing.',
        meta: {
          client: 'Conrad Light',
          services: ['Music video production', 'Creative direction', 'Post-production'],
        },
        videos: [
          {
            url: 'https://youtu.be/KBIxkQdbKUw',
            thumbnail: portfolioVideoThumbnails.conradLight,
            thumbnailAlt: 'Conrad Light — Fade With Me music video thumbnail',
            title: 'Conrad Light — Fade With Me',
            caption: 'Official music video production for Conrad Light.',
          },
        ],
      },
    },
    {
      id: 'product-shoot',
      slug: 'product-shoot',
      title: 'Product Shoot',
      category: 'product-photography',
      description: 'High-end product photography that highlights every detail.',
      image: '/gallery/product-photography/product-shoot.svg',
      imageAlt: 'Product photography shoot',
      detail: {
        summary:
          'Studio and lifestyle product photography built for e-commerce, catalogues, and paid social — consistent lighting, styling, and brand-aligned art direction.',
        meta: {
          client: 'Local retail brand',
          services: ['Product photography', 'Retouching', 'E-commerce assets'],
          year: '2025',
        },
        images: [
          {
            src: '/gallery/product-photography/product-shoot.svg',
            alt: 'Hero product on white background',
            caption: 'Hero product shot for online store listing.',
          },
          {
            src: '/images/product-photo.svg',
            alt: 'Lifestyle product placement',
            caption: 'Lifestyle frame for social and email campaigns.',
          },
          {
            src: '/gallery/product-photography/product-shoot.svg',
            alt: 'Product detail close-up',
            caption: 'Detail close-up for ads and catalogue pages.',
          },
        ],
      },
    },
    {
      id: 'client-meeting',
      slug: 'client-meeting',
      title: 'Client Meeting',
      category: 'client-meetings',
      description: 'Strategy-led meetings that turn ideas into action.',
      image: '/gallery/client-meetings/client-meeting.svg',
      imageAlt: 'Strategy client meeting',
      detail: {
        summary:
          'Structured strategy sessions that align leadership on priorities, messaging, and measurable next steps — the foundation for content, campaigns, and growth plans.',
        meta: {
          client: 'Growing service business',
          services: ['Strategy workshop', 'Growth planning', 'Content roadmap'],
          year: '2025',
        },
        images: [
          {
            src: '/gallery/client-meetings/client-meeting.svg',
            alt: 'Strategy workshop in progress',
            caption: 'Facilitated session mapping goals, audience, and channels.',
          },
          {
            src: '/images/client-meeting.svg',
            alt: 'Workshop notes and planning board',
            caption: 'Action plan delivered as a phased implementation roadmap.',
          },
        ],
        testimonial: {
          quote:
            'We left with clarity we had been missing for months. The roadmap made it easy to decide what to do first — and what to stop doing.',
          author: 'James K.',
          role: 'Founder',
          company: 'Professional services firm',
        },
      },
    },
    {
      id: 'facebook-page',
      slug: 'facebook-page',
      title: 'Facebook Page Managed',
      category: 'facebook-pages',
      description: 'End-to-end page management that drives engagement.',
      image: '/images/facebook-page.svg',
      imageAlt: 'Social media page management visual',
      detail: {
        summary:
          'Full Facebook page management — content planning, posting, community engagement, and performance reporting aligned to business goals.',
        meta: {
          client: 'Tourism operator',
          services: ['Content management', 'Community management', 'Monthly reporting'],
          year: '2025',
        },
        images: [
          {
            src: '/images/facebook-page.svg',
            alt: 'Facebook page content grid',
            caption: 'Consistent visual system across posts and campaigns.',
          },
          {
            src: '/images/event.svg',
            alt: 'Campaign creative for seasonal promotion',
            caption: 'Seasonal campaign creative supporting bookings.',
          },
        ],
      },
    },
    {
      id: 'tourism-campaign',
      slug: 'tourism-campaign',
      title: 'Tourism Campaign',
      category: 'tourism-accommodation',
      description: 'Compelling visuals that inspire travel and bookings.',
      image: '/gallery/tourism-accommodation/tourism-campaign.svg',
      imageAlt: 'Tourism marketing campaign',
      isVideo: true,
      detail: {
        summary:
          'Integrated tourism campaign combining video, photography, and paid social creative to drive destination awareness and direct bookings.',
        meta: {
          client: 'Eastern Cape tourism operator',
          services: ['Campaign creative', 'Video production', 'Social ad assets'],
          year: '2025',
        },
        videos: [
          {
            thumbnail: '/gallery/tourism-accommodation/tourism-campaign.svg',
            thumbnailAlt: 'Tourism campaign hero video',
            title: 'Destination hero video',
            caption: '15-second and 30-second cuts for Meta ads.',
          },
        ],
        images: [
          {
            src: '/images/tourism.svg',
            alt: 'Destination landscape photography',
            caption: 'Landscape imagery for ads and landing pages.',
          },
          {
            src: '/images/accommodation.svg',
            alt: 'Accommodation experience photography',
            caption: 'Experience-led frames highlighting stays and activities.',
          },
        ],
      },
    },
    {
      id: 'resort-photography',
      slug: 'resort-photography',
      title: 'Resort Photography',
      category: 'tourism-accommodation',
      description: 'Premium imagery that showcases luxury and experience.',
      image: '/images/tourism.svg',
      imageAlt: 'Tourism and accommodation marketing visual',
      detail: {
        summary:
          'Resort and accommodation photography capturing rooms, amenities, and guest experience — ready for websites, OTAs, and brochure use.',
        meta: {
          client: 'Boutique resort',
          services: ['Accommodation photography', 'Image editing', 'Web-ready delivery'],
          year: '2025',
        },
        images: [
          {
            src: '/images/tourism.svg',
            alt: 'Resort exterior at golden hour',
            caption: 'Exterior hero image for the website homepage.',
          },
          {
            src: '/images/accommodation.svg',
            alt: 'Suite interior photography',
            caption: 'Suite photography for booking platforms.',
          },
          {
            src: '/gallery/tourism-accommodation/tourism-campaign.svg',
            alt: 'Pool and leisure area',
            caption: 'Leisure areas supporting upsell and package marketing.',
          },
        ],
      },
    },
    {
      id: 'event-coverage',
      slug: 'event-coverage',
      title: 'Event Coverage',
      category: 'events',
      description: 'Capturing moments that make events unforgettable.',
      image: '/gallery/events/event-coverage.svg',
      imageAlt: 'Event media coverage',
      isVideo: true,
      detail: {
        summary:
          'Photo and video coverage for corporate and hospitality events — highlight reels, social clips, and same-day content for live promotion.',
        meta: {
          client: 'Corporate event host',
          services: ['Event photography', 'Highlight video', 'Same-day social clips'],
          year: '2025',
        },
        videos: [
          {
            thumbnail: '/gallery/events/event-coverage.svg',
            thumbnailAlt: 'Event highlight reel',
            title: '60-second highlight reel',
            caption: 'Recap video for email follow-up and social sharing.',
          },
        ],
        images: [
          {
            src: '/gallery/events/event-coverage.svg',
            alt: 'Event crowd and stage photography',
            caption: 'Coverage across keynote, networking, and brand moments.',
          },
          {
            src: '/images/event.svg',
            alt: 'Event detail and branding',
            caption: 'Detail shots for post-event marketing.',
          },
        ],
      },
    },
    {
      id: 'business-growth-campaign',
      slug: 'business-growth-campaign',
      title: 'Business Growth Campaign',
      category: 'business-growth',
      description: 'Data-driven strategies that support real business results.',
      image: '/images/business-growth.svg',
      imageAlt: 'Business growth chart and strategy visual',
      detail: {
        summary:
          'Growth campaign tying content, offers, and reporting together — focused on measurable outcomes such as leads, bookings, and repeat sales.',
        meta: {
          client: 'Multi-location service business',
          services: ['Growth strategy', 'Campaign management', 'Performance reporting'],
          year: '2025',
        },
        images: [
          {
            src: '/images/business-growth.svg',
            alt: 'Growth dashboard and strategy visual',
            caption: 'Reporting framework aligned to business KPIs.',
          },
          {
            src: '/images/cinema-camera.svg',
            alt: 'Campaign creative in production',
            caption: 'Creative production supporting the campaign funnel.',
          },
        ],
        testimonial: {
          quote:
            'For the first time our marketing felt connected to sales. We could see which content actually moved people to book.',
          author: 'Linda P.',
          role: 'Operations Manager',
          company: 'Multi-location retailer',
        },
      },
    },
  ] as PortfolioItem[],
  /** IDs of items to feature on the home page */
  featuredIds: [
    'brand-film-feature',
    'product-shoot-feature',
    'client-meeting-feature',
    'tourism-feature',
    'events-feature',
  ],
  /** Home page featured category cards (subset preview) */
  featuredPreview: [
    {
      id: 'company-promo-preview',
      slug: 'brand-film',
      title: 'Company Promo',
      category: 'videos',
      description: 'Corporate Film',
      image: raster.portfolio.companyPromo,
      imageAlt: 'Company promo video preview',
      isVideo: true,
    },
    {
      id: 'product-demo-preview',
      slug: 'product-shoot',
      title: 'Product Demo',
      category: 'videos',
      description: 'Commercial Video',
      image: raster.portfolio.productDemo,
      imageAlt: 'Product demo video preview',
      isVideo: true,
    },
    {
      id: 'website-design-preview',
      slug: 'brand-film',
      title: 'Website Design',
      category: 'business-growth',
      description: 'E-Commerce',
      image: raster.portfolio.websiteDesign,
      imageAlt: 'Website design preview',
    },
    {
      id: 'product-photography-preview',
      slug: 'product-shoot',
      title: 'Product Photography',
      category: 'product-photography',
      description: 'Lifestyle Shoot',
      image: raster.portfolio.productPhotography,
      imageAlt: 'Product photography preview',
    },
  ] as PortfolioItem[],
} as const;

export function getFeaturedItems(): PortfolioItem[] {
  return portfolioConfig.featuredPreview;
}

export function getPortfolioItemBySlug(slug: string): PortfolioItem | undefined {
  return portfolioConfig.items.find((item) => item.slug === slug);
}

/** Videos from portfolio items in the videos category */
export function getPortfolioVideoItems(): PortfolioMediaVideo[] {
  return portfolioConfig.items
    .filter((item) => item.category === 'videos')
    .flatMap((item) => item.detail?.videos ?? []);
}

/** Simola / brand-film photography stills */
export function getSimolaPhotos(): PortfolioMediaImage[] {
  const brandFilm = getPortfolioItemBySlug('brand-film');
  return brandFilm?.detail?.images ?? [];
}

export function getCategoryLabel(categoryId: string): string {
  if (categoryId === 'all') return 'All';
  const category = portfolioConfig.categories.find((entry) => entry.id === categoryId);
  return category?.label ?? categoryId;
}

export type PortfolioConfig = typeof portfolioConfig;
