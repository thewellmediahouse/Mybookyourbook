import { and, eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { plans } from "@/lib/db/schema";
import { parseMeta, toPlanView, type PlanRecord, type PlanView, type PricingRegion } from "@/lib/plans/format";
import { billingForCountry } from "@/lib/workspaces/billing-country";

export { parsePricingRegion, type PricingRegion } from "@/lib/plans/format";

export function regionForWorkspace(country: string, billingCurrency: string): PricingRegion {
  const billing = billingForCountry(country);
  if (billing.billingCurrency !== billingCurrency) {
    return billingCurrency === "ZAR" ? "ZA" : "INT";
  }
  return billing.region;
}

export function paystackPlanCode(metadataJson: string | null): string | undefined {
  const meta = parseMeta(metadataJson);
  return typeof meta.paystackPlanCode === "string" && meta.paystackPlanCode.trim()
    ? meta.paystackPlanCode.trim()
    : undefined;
}

export type CatalogPlan = PlanRecord & { active: boolean };

export function isPurchasablePlan<
  T extends { active: boolean; amountMinor: number | null; credits: number | null },
>(plan: T): plan is T & { amountMinor: number; credits: number } {
  return plan.active && plan.amountMinor != null && plan.credits != null && plan.credits >= 1;
}

export async function getPlanById(db: Db, planId: string): Promise<CatalogPlan | null> {
  const [row] = await db
    .select({
      id: plans.id,
      code: plans.code,
      name: plans.name,
      region: plans.region,
      currency: plans.currency,
      amountMinor: plans.amountMinor,
      credits: plans.credits,
      interval: plans.interval,
      metadataJson: plans.metadataJson,
      active: plans.active,
    })
    .from(plans)
    .where(eq(plans.id, planId))
    .limit(1);
  return row ?? null;
}

export async function listWorkspaceCatalog(
  db: Db,
  input: { country: string; billingCurrency: string },
): Promise<PlanView[]> {
  const region = regionForWorkspace(input.country, input.billingCurrency);
  const rows = await db
    .select({
      id: plans.id,
      code: plans.code,
      name: plans.name,
      region: plans.region,
      currency: plans.currency,
      amountMinor: plans.amountMinor,
      credits: plans.credits,
      interval: plans.interval,
      metadataJson: plans.metadataJson,
      active: plans.active,
    })
    .from(plans)
    .where(and(eq(plans.region, region), eq(plans.active, true)));

  const rank = ["first_commercial", "single", "starter", "business", "growth", "agency"];
  return rows
    .filter((row) => row.currency === input.billingCurrency)
    .map((row) => toPlanView(row))
    .sort((a, b) => rank.indexOf(a.code) - rank.indexOf(b.code));
}

export async function insertTestPlan(
  db: Db,
  plan: PlanRecord & { active?: boolean },
): Promise<PlanRecord> {
  const nowActive = plan.active ?? true;
  await db.insert(plans).values({
    id: plan.id,
    code: plan.code,
    name: plan.name,
    region: plan.region,
    currency: plan.currency,
    amountMinor: plan.amountMinor,
    credits: plan.credits,
    interval: plan.interval,
    active: nowActive,
    metadataJson: plan.metadataJson,
  });
  return plan;
}
