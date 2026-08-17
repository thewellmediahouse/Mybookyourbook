import { shopConfig } from '@/config/shop';
import type { Money } from './types';

export function formatMoney(money: Money, locale = shopConfig.moneyLocale): string {
  const amount = Number.parseFloat(money.amount);
  if (Number.isNaN(amount)) return money.amount;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: money.currencyCode,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${money.currencyCode} ${amount.toFixed(2)}`;
  }
}
