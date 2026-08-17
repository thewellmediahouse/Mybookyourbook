/**
 * Testimonials — maps to NEW_WEBSITE_INPUT_SPEC "Testimonials" (optional).
 */
export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company?: string;
  /** Optional portrait path under `public/`. */
  avatar?: string;
  avatarAlt?: string;
}

export const testimonialsConfig: Testimonial[] = [
  {
    quote:
      'Acme helped us relaunch in six weeks. Traffic is up, and our sales team finally has a site they are proud to share.',
    author: 'Jordan Lee',
    role: 'CEO',
    company: 'Northline Supply',
  },
  {
    quote:
      'Clear process, sharp design, and zero drama. They translated our messy ideas into a focused brand story.',
    author: 'Priya Sharma',
    role: 'Marketing Director',
    company: 'Brightpath Health',
  },
  {
    quote:
      'The new site scores 95+ on Lighthouse and our support tickets about navigation dropped immediately.',
    author: 'Marcus Chen',
    role: 'Operations Lead',
    company: 'Atlas Logistics',
  },
];

export type TestimonialsConfig = typeof testimonialsConfig;
