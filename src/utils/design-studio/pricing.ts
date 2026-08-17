import { designStudioConfig } from '@/config/designStudio';
import type { DesignBrief, PriceSummary } from '@/types/designStudio';
import {
  calculatePriceSummaryFromConfig,
  formatZar,
} from '@/utils/design-studio/pricingCore';

const CUSTOM_SCOPE_TYPES = new Set<string>(
  designStudioConfig.websiteTypes
    .filter((type) => 'note' in type && Boolean(type.note))
    .map((type) => type.value),
);

/**
 * Server-side price calculation source of truth.
 * Never trust a browser-supplied amount.
 */
export function calculatePriceSummary(
  brief: Pick<DesignBrief, 'websiteType' | 'features'>,
): PriceSummary {
  return calculatePriceSummaryFromConfig(
    brief,
    designStudioConfig.pricing,
    CUSTOM_SCOPE_TYPES,
  );
}

export { formatZar };

export function isCustomScopeWebsiteType(websiteType: string): boolean {
  return CUSTOM_SCOPE_TYPES.has(websiteType);
}
