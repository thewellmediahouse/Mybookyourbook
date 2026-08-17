/**
 * Post-purchase / conversion thank-you page (Ads, Shopify checkout return).
 * Not linked from main/footer navigation. Sitemap-excluded and noindex.
 */
export const THANK_YOU_PATH = '/thank-you/';

export const thankYouConfig = {
  eyebrow: 'Order confirmed',
  heading: 'Thank you for your order',
  paragraph: 'Your purchase is confirmed. We’ll be in touch with updates shortly.',
  supportingText:
    'A confirmation email is on its way. If you have any questions, contact us anytime.',
  primaryCta: { label: 'Continue shopping', href: '/shop/' },
  secondaryCta: { label: 'Back to home', href: '/' },
  contactCta: { label: 'Contact us', href: '/contact/' },
} as const;

export type ThankYouConfig = typeof thankYouConfig;
