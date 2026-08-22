import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { plans } from "@/lib/db/schema";
import { parsePricingRegion, toPlanView, type PlanView, type PricingRegion } from "./format";

export { parsePricingRegion, type PricingRegion };

export async function listActivePlans(region: PricingRegion): Promise<PlanView[]> {
  const db = await getDb();
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
    })
    .from(plans)
    .where(and(eq(plans.region, region), eq(plans.active, true)));

  const rank = ["first_commercial", "single", "starter", "business", "growth", "agency"];
  return rows
    .map(toPlanView)
    .sort((a, b) => rank.indexOf(a.code) - rank.indexOf(b.code));
}
