import { shopConfig } from '@/config/shop';
import type { Money } from './types';

type Option = { name: string; value: string };

type PricedVariant = {
  price: Money;
  selectedOptions: Option[];
};

export type AddonBreakdown = {
  unit: Money;
  addon: Money;
  total: Money;
};

function getAddonConfig() {
  return shopConfig.addonPricing;
}

/** True when the selected options include a non-base add-on value. */
export function isAddonSelection(selectedOptions: Option[]): boolean {
  const config = getAddonConfig();
  if (!config) return false;
  const addon = selectedOptions.find((option) => option.name === config.optionName);
  return Boolean(addon && addon.value !== config.baseValue);
}

export function findBaseSibling<T extends PricedVariant>(variants: T[], selected: T): T | null {
  const config = getAddonConfig();
  if (!config) return null;

  const nonAddonOptions = selected.selectedOptions.filter(
    (option) => option.name !== config.optionName,
  );

  return (
    variants.find((variant) => {
      const addon = variant.selectedOptions.find(
        (option) => option.name === config.optionName,
      );
      if (!addon || addon.value !== config.baseValue) return false;

      return nonAddonOptions.every((option) =>
        variant.selectedOptions.some(
          (candidate) => candidate.name === option.name && candidate.value === option.value,
        ),
      );
    }) ?? null
  );
}

/**
 * When add-on pricing is configured and an add-on variant is selected,
 * derive unit + add-on amounts from the base sibling price.
 */
export function getAddonBreakdown<T extends PricedVariant>(
  variants: T[],
  selected: T | null | undefined,
): AddonBreakdown | null {
  if (!selected || !isAddonSelection(selected.selectedOptions)) return null;

  const base = findBaseSibling(variants, selected);
  if (!base) return null;

  const unitAmount = Number.parseFloat(base.price.amount);
  const totalAmount = Number.parseFloat(selected.price.amount);
  if (Number.isNaN(unitAmount) || Number.isNaN(totalAmount)) return null;

  const addonAmount = totalAmount - unitAmount;
  if (addonAmount <= 0) return null;

  return {
    unit: base.price,
    addon: {
      amount: addonAmount.toFixed(2),
      currencyCode: selected.price.currencyCode,
    },
    total: selected.price,
  };
}

/** Prefer a purchasable base (non-addon) variant when add-on pricing is enabled. */
export function pickDefaultVariant<T extends PricedVariant & { availableForSale: boolean; id: string }>(
  variants: T[],
): T | undefined {
  const preferBase = Boolean(getAddonConfig());
  if (preferBase) {
    const baseAvailable = variants.find(
      (variant) => variant.availableForSale && !isAddonSelection(variant.selectedOptions),
    );
    if (baseAvailable) return baseAvailable;
  }
  return variants.find((variant) => variant.availableForSale) ?? variants[0];
}
