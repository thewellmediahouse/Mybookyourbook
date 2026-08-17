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
    | 'professionalServices'
    | 'portfolio'
    | 'blog'
    | 'team'
    | 'testimonials'
  >;
  /** Nested links shown in a dropdown / expandable group */
  children?: NavItem[];
  /** When set, item is only shown if that feature flag is on */
  feature?: 'designStudio';
}

const allNavItems: NavItem[] = [
  { label: 'Home', href: '/', pageKey: 'home' },
  { label: 'About', href: '/about', pageKey: 'about' },
  { label: 'Services', href: '/services', pageKey: 'services' },
  {
    label: 'Pricing',
    href: '/pricing',
    pageKey: 'pricing',
    children: [
      { label: 'Business Packages', href: '/pricing', pageKey: 'pricing' },
      {
        label: 'Professional Services Package',
        href: '/pricing/professional-services',
        pageKey: 'professionalServices',
      },
    ],
  },
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
  if (item.pageKey && !pagesConfig[item.pageKey]) return false;
  return true;
}

function filterNavItem(item: NavItem): NavItem | null {
  if (!isNavItemVisible(item)) return null;
  if (!item.children?.length) return item;

  const children = item.children.map(filterNavItem).filter((child): child is NavItem => child !== null);
  if (children.length === 0) {
    // Parent stays if its own page is on; drop empty dropdowns that only existed for children
    return item.pageKey && pagesConfig[item.pageKey] ? { ...item, children: undefined } : null;
  }

  // If only one child remains and it matches the parent href, flatten
  if (children.length === 1 && children[0].href === item.href) {
    return { ...item, children: undefined };
  }

  return { ...item, children };
}

export const mainNavigation: NavItem[] = allNavItems
  .map(filterNavItem)
  .filter((item): item is NavItem => item !== null);

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
  {
    label: 'Professional Services Package',
    href: '/pricing/professional-services',
    pageKey: 'professionalServices',
  },
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

export const footerServiceLinks: NavItem[] = allFooterServiceLinks
  .map(filterNavItem)
  .filter((item): item is NavItem => item !== null);

export const footerNavigation: NavItem[] = [
  ...mainNavigation
    .filter((item) => item.href !== '/')
    .flatMap((item) =>
      item.children?.length
        ? item.children
        : [item],
    ),
  ...(pagesConfig.privacy ? [{ label: 'Privacy Policy', href: '/privacy' }] : []),
  ...(pagesConfig.terms ? [{ label: 'Terms of Service', href: '/terms' }] : []),
];

export type NavigationConfig = typeof mainNavigation;
