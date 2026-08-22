import { PageIntro } from "@/components/dashboard/page-intro";
import { getDb } from "@/lib/db/client";
import { plans } from "@/lib/db/schema";
import { parseMeta } from "@/lib/plans/format";
import { PlanEditForm } from "@/components/admin/plan-form";

export default async function AdminPricingPage() {
  const db = await getDb();
  const rows = await db.select().from(plans);
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
      <PageIntro
        kicker="STAFF"
        title="Pricing"
        description="Changing a price does not change payments already recorded."
      />
      <ul className="mt-8 grid gap-6">
        {rows.map((row) => (
          <li key={row.id}>
            <PlanEditForm
              planId={row.id}
              name={row.name}
              region={row.region}
              amountMinor={row.amountMinor}
              currency={row.currency}
              credits={row.credits}
              interval={row.interval}
              active={row.active}
              introductoryOffer={parseMeta(row.metadataJson).introductory === true}
            />
          </li>
        ))}
      </ul>
    </main>
  );
}
