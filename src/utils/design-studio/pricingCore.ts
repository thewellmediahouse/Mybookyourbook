import type { DesignBrief, PriceSummary } from '../../types/designStudio.ts';

export type PricingConfigSlice = {
  currency: 'ZAR';
  staticWebsitePriceZar: number;
  websiteWithShopPriceZar: number;
  onlineShopFromZar?: number;
  onlineShopToZar?: number;
  depositPercent: number;
};

/** Client-facing estimate copy for the wizard (may show a range for shop packages). */
export function formatWizardPriceEstimate(
  brief: Pick<DesignBrief, 'websiteType' | 'features'>,
  pricing: PricingConfigSlice,
  customScopeTypes: ReadonlySet<string>,
): { headline: string; detail: string } {
  const summary = calculatePriceSummaryFromConfig(brief, pricing, customScopeTypes);
  if (summary.requiresQuote) {
    return {
      headline: 'Custom quote',
      detail: 'Final price confirmed by our team after we review your requirements.',
    };
  }

  if (includesShop(brief)) {
    const from = pricing.onlineShopFromZar ?? 10_000;
    const to = pricing.onlineShopToZar ?? pricing.websiteWithShopPriceZar;
    return {
      headline: `${formatZar(from)} – ${formatZar(to)}`,
      detail: 'Website + online shop package (typical range). Final amount confirmed at checkout.',
    };
  }

  return {
    headline: formatZar(pricing.staticWebsitePriceZar),
    detail: 'Static / business website (up to 4 pages).',
  };
}

function includesShop(brief: Pick<DesignBrief, 'websiteType' | 'features'>): boolean {
  if (brief.websiteType === 'Online store') return true;
  return (brief.features ?? []).includes('Online shop');
}

/**
 * Pure price calculation — pass config explicitly so tests need no path aliases.
 * Production wrapper injects designStudioConfig.
 */
export function calculatePriceSummaryFromConfig(
  brief: Pick<DesignBrief, 'websiteType' | 'features'>,
  pricing: PricingConfigSlice,
  customScopeTypes: ReadonlySet<string>,
): PriceSummary {
  const websiteType = brief.websiteType || 'Unknown';

  if (customScopeTypes.has(websiteType)) {
    return {
      currency: pricing.currency,
      websiteType,
      amountZar: null,
      depositPercent: pricing.depositPercent,
      payableZar: null,
      requiresQuote: true,
      label: 'Custom scope — final price confirmed by our team',
      lineItems: [{ label: 'Custom website / portal scope', amountZar: null }],
    };
  }

  const withShop = includesShop(brief);
  const amountZar = withShop
    ? pricing.websiteWithShopPriceZar
    : pricing.staticWebsitePriceZar;

  const payableZar = Math.round((amountZar * pricing.depositPercent) / 100);

  return {
    currency: pricing.currency,
    websiteType,
    amountZar,
    depositPercent: pricing.depositPercent,
    payableZar,
    requiresQuote: false,
    label: withShop ? 'Website + online shop' : 'Static / business website',
    lineItems: [
      {
        label: withShop
          ? 'Website development with online shop'
          : 'Website development (business / landing)',
        amountZar,
      },
    ],
  };
}

export function formatZar(amount: number | null): string {
  if (amount == null) return 'Quote required';
  return `R${amount.toLocaleString('en-ZA')}`;
}
