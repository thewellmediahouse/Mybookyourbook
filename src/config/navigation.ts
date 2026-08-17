import { pagesConfig } from './pages';
import { servicesConfig } from './services';

export interface NavItem {
  label: string;
  href: string;
  pageKey?: keyof Pick<
    typeof pagesConfig,
    | 'home'
    | 'about'
    | 'services'
    | 'contact'
    | 'faq'
    | 'pricing'
    | 'portfolio'
    | 'blog'
    | 'team'
    | 'testimonials'
  >;
}

const allNavItems: NavItem[] = [
  { label: 'Home', href: '/', pageKey: 'home' },
  { label: 'About', href: '/about', pageKey: 'about' },
  { label: 'Services', href: '/services', pageKey: 'services' },
  { label: 'Portfolio', href: '/portfolio', pageKey: 'portfolio' },
  { label: 'FAQ', href: '/faq', pageKey: 'faq' },
  { label: 'Pricing', href: '/pricing', pageKey: 'pricing' },
  { label: 'Blog', href: '/blog', pageKey: 'blog' },
  { label: 'Team', href: '/team', pageKey: 'team' },
  { label: 'Testimonials', href: '/testimonials', pageKey: 'testimonials' },
  { label: 'Contact', href: '/contact', pageKey: 'contact' },
];

export const mainNavigation: NavItem[] = allNavItems.filter(
  (item) => !item.pageKey || pagesConfig[item.pageKey],
);

export const headerCta = {
  label: 'Get in touch',
  href: '/contact',
};

export const footerServiceLinks: NavItem[] = servicesConfig.slice(0, 3).map((service) => ({
  label: service.name,
  href: `/services#${service.slug}`,
}));

export const footerNavigation: NavItem[] = [
  ...mainNavigation.filter((item) => item.href !== '/'),
  ...(pagesConfig.privacy ? [{ label: 'Privacy Policy', href: '/privacy' }] : []),
  ...(pagesConfig.terms ? [{ label: 'Terms of Service', href: '/terms' }] : []),
];

export type NavigationConfig = typeof mainNavigation;
