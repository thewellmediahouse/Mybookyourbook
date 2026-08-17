import { designStudioConfig } from './designStudio';
import { pagesConfig } from './pages';

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
  /** When set, item is only shown if that feature flag is on */
  feature?: 'designStudio';
}

const allNavItems: NavItem[] = [
  { label: 'Home', href: '/', pageKey: 'home' },
  { label: 'About', href: '/about', pageKey: 'about' },
  { label: 'Services', href: '/services', pageKey: 'services' },
  { label: 'Pricing', href: '/pricing', pageKey: 'pricing' },
  { label: 'Portfolio', href: '/portfolio', pageKey: 'portfolio' },
  {
    label: 'Design Your Website',
    href: '/design-your-website',
    feature: 'designStudio',
  },
  { label: 'Contact', href: '/contact', pageKey: 'contact' },
  { label: 'FAQ', href: '/faq', pageKey: 'faq' },
  { label: 'Blog', href: '/blog', pageKey: 'blog' },
  { label: 'Team', href: '/team', pageKey: 'team' },
  { label: 'Testimonials', href: '/testimonials', pageKey: 'testimonials' },
];

function isNavItemVisible(item: NavItem): boolean {
  if (item.feature === 'designStudio' && !designStudioConfig.enabled) return false;
  return !item.pageKey || pagesConfig[item.pageKey];
}

export const mainNavigation: NavItem[] = allNavItems.filter(isNavItemVisible);

export const headerCta = {
  label: 'Book Consultation',
  href: '/contact',
};

/** Footer service links — from The Well Media spec */
const allFooterServiceLinks: NavItem[] = [
  { label: 'Content Creation', href: '/pricing#content-creation' },
  { label: 'Content Management', href: '/pricing#content-management' },
  { label: 'Business Growth', href: '/pricing#business-growth' },
  { label: 'Starter / Launch Pack', href: '/pricing#launch-pack' },
  { label: 'Website Development', href: '/pricing#once-off-services' },
  {
    label: 'Design Your Website',
    href: '/design-your-website',
    feature: 'designStudio',
  },
  { label: 'Product Photography', href: '/pricing#once-off-services' },
  { label: 'Event Marketing', href: '/pricing#business-growth' },
  { label: 'Tourism & Accommodation Marketing', href: '/contact' },
];

export const footerServiceLinks: NavItem[] = allFooterServiceLinks.filter(isNavItemVisible);

export const footerNavigation: NavItem[] = [
  ...mainNavigation.filter((item) => item.href !== '/'),
  ...(pagesConfig.privacy ? [{ label: 'Privacy Policy', href: '/privacy' }] : []),
  ...(pagesConfig.terms ? [{ label: 'Terms of Service', href: '/terms' }] : []),
];

export type NavigationConfig = typeof mainNavigation;
