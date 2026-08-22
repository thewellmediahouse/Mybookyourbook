export type PlanRecord = {
  id: string;
  code: string;
  name: string;
  region: string;
  currency: string;
  amountMinor: number | null;
  credits: number | null;
  interval: "one_time" | "month";
  metadataJson: string | null;
};

export type PlanView = PlanRecord & {
  highlighted: boolean;
  custom: boolean;
  fromPrice: boolean;
  priceLabel: string;
  creditLabel: string;
};

export type PricingRegion = "ZA" | "INT";

export function parsePricingRegion(value: string | undefined): PricingRegion {
  return value?.toUpperCase() === "INT" ? "INT" : "ZA";
}

export function parseMeta(raw: string | null): Record<string, unknown> {
  if (!raw) {
    return {};
  }
  try {
    const value = JSON.parse(raw) as unknown;
    return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function formatMoney(amountMinor: number, currency: string): string {
  const amount = amountMinor / 100;
  if (currency === "ZAR") {
    return `R${Math.round(amount).toLocaleString("en-US")}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function toPlanView(plan: PlanRecord): PlanView {
  const meta = parseMeta(plan.metadataJson);
  const highlighted = meta.highlighted === true;
  const custom = meta.custom === true;
  const fromPrice = meta.from === true;
  let priceLabel = "Custom";
  if (plan.amountMinor != null) {
    const money = formatMoney(plan.amountMinor, plan.currency);
    const suffix = plan.interval === "month" ? "/month" : "";
    priceLabel = fromPrice ? `From ${money}${suffix}` : `${money}${suffix}`;
  }
  const creditLabel =
    plan.credits == null
      ? "Talk to us after you create a studio"
      : plan.credits === 1
        ? "1 Ad Credit"
        : `${plan.credits} Ad Credits`;
  return {
    ...plan,
    highlighted,
    custom,
    fromPrice,
    priceLabel,
    creditLabel,
  };
}
