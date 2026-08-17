/**
 * Portfolio — maps to SITE_SPEC (docs/SITE_SPEC.schema.json) "Portfolio" and "Featured Work Preview".
 */
export interface PortfolioMediaImage {
  src: string;
  alt: string;
  caption?: string;
}

export interface PortfolioMediaVideo {
  thumbnail?: string;
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
  image: string;
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
    { id: 'strategy', label: 'Strategy' },
    { id: 'design', label: 'Design' },
    { id: 'development', label: 'Development' },
  ] satisfies PortfolioCategory[],
  items: [
    {
      id: 'project-1',
      slug: 'brand-refresh',
      title: 'Brand refresh for regional retailer',
      category: 'design',
      description: 'Visual identity and storefront experience aligned to a new growth strategy.',
      image: '/images/hero.svg',
      imageAlt: 'Placeholder — brand refresh project showcase',
      detail: {
        summary:
          'A full brand refresh spanning identity, in-store touchpoints, and digital assets — built to support a regional expansion plan.',
        meta: {
          client: 'Regional retailer',
          services: ['Brand strategy', 'Visual identity', 'Retail collateral'],
          year: '2025',
        },
        images: [
          {
            src: '/images/hero.svg',
            alt: 'Brand refresh hero visual',
            caption: 'Primary brand lockup and colour system.',
          },
        ],
      },
    },
    {
      id: 'project-2',
      slug: 'website-launch',
      title: 'Lead generation website launch',
      category: 'development',
      description: 'Fast, SEO-ready site with clear conversion paths and service positioning.',
      image: '/images/hero.svg',
      imageAlt: 'Placeholder — website launch project showcase',
      detail: {
        summary:
          'A conversion-focused marketing site with structured service pages, enquiry paths, and SEO foundations.',
        meta: {
          client: 'B2B services company',
          services: ['Website development', 'SEO setup', 'Conversion copy'],
          year: '2025',
        },
      },
    },
    {
      id: 'project-3',
      slug: 'strategy-workshop',
      title: 'Go-to-market strategy workshop',
      category: 'strategy',
      description: 'Facilitated planning sessions that clarified priorities and measurable KPIs.',
      image: '/images/hero.svg',
      imageAlt: 'Placeholder — strategy workshop project showcase',
      detail: {
        summary:
          'Facilitated workshops that aligned leadership on positioning, priorities, and a phased go-to-market plan.',
        meta: {
          client: 'Growth-stage startup',
          services: ['Strategy workshop', 'Go-to-market planning'],
          year: '2025',
        },
        testimonial: {
          quote: 'We finally had a shared plan everyone could execute against.',
          author: 'Alex R.',
          role: 'Founder',
        },
      },
    },
  ] as PortfolioItem[],
  /** IDs of items to feature on the home page (typically 3–6) */
  featuredIds: ['project-1', 'project-2', 'project-3'],
} as const;

export function getFeaturedItems(): PortfolioItem[] {
  return portfolioConfig.featuredIds.flatMap((id) => {
    const item = portfolioConfig.items.find((entry) => entry.id === id);
    return item ? [item] : [];
  });
}

export function getPortfolioItemBySlug(slug: string): PortfolioItem | undefined {
  return portfolioConfig.items.find((item) => item.slug === slug);
}

export function getCategoryLabel(categoryId: string): string {
  if (categoryId === 'all') return 'All';
  const category = portfolioConfig.categories.find((entry) => entry.id === categoryId);
  return category?.label ?? categoryId;
}

export type PortfolioConfig = typeof portfolioConfig;
