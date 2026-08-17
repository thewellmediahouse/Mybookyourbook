/**
 * Testimonials — The Well Media
 * Verified client testimonials for the home page.
 */
import type { ImageMetadata } from 'astro';
import { raster } from '@/assets/raster';

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company?: string;
  avatar?: ImageMetadata | string;
  avatarAlt?: string;
}

export const testimonialsConfig: Testimonial[] = [
  {
    quote:
      'Very professional and exceptional media photos & videos! Bringing out the natural beauty of every aspect captured. Delivering a service with integrity, professionalism and perfection! Also they helped my business grow like crazy. Will recommend The Well Media House to anyone, without a doubt!',
    author: 'Adri Labuschagne',
    role: 'CEO',
    company: 'MK Deli',
    avatar: raster.testimonials.adriLabuschagne,
    avatarAlt: 'Adri Labuschagne, CEO of MK Deli',
  },
  {
    quote:
      'Thanks to The Well Media House, especially Schalk, for the professional way in which you produce the very high quality promotional video for Fonteine Park Pharmacy. It was a pleasure working with you.',
    author: 'Willem du Preez',
    role: 'Fonteine Park Pharmacy',
    avatar: raster.testimonials.willemDuPreez,
    avatarAlt: 'Willem du Preez, Fonteine Park Pharmacy',
  },
  {
    quote:
      'Schalk and his team are just next level. Their marketing strategies are out of this world and meant a lot to our ministry. They managed to grow our Facebook page organically from 3,800 followers to now 104,000 followers in only 5 years. His out of the box thinking gives momentum to our vision and creates momentum financially.',
    author: 'Barbara Claassen',
    role: 'CEO and Founder',
    company: 'The Well Dream Centre',
    avatar: raster.testimonials.barbaraClaassen,
    avatarAlt: 'Barbara Claassen, CEO and Founder of The Well Dream Centre',
  },
];

export type TestimonialsConfig = typeof testimonialsConfig;
