import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/site/page-intro";
import { PublicFrame } from "@/components/site/public-frame";
import { PublicShell } from "@/components/site/public-shell";
import { RegionToggle } from "@/components/site/region-toggle";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { listActivePlans, parsePricingRegion } from "@/lib/plans/queries";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "One Ad Credit starts one new commercial production. Concept work before production does not use a credit.",
};

export const dynamic = "force-dynamic";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  const region = parsePricingRegion((await searchParams).region);
  const catalog = await listActivePlans(region);
  const session = await getSession();
  const ctaHref = session ? "/dashboard/billing" : "/signup";
  const ctaLabel = session ? "Go to Billing" : "Create an account";

  return (
    <PublicShell>
      <main className="pb-20 sm:pb-28">
        <PageIntro
          eyebrow="PRICING"
          title="Simple plans. One credit per production."
          description="One Ad Credit starts one new commercial production. Concept and script changes before production do not use a credit. We do not offer unlimited generation or unlimited revisions."
        />
        <PublicFrame className="mt-8">
          <RegionToggle region={region} />
          <p className="mt-3 max-w-2xl text-sm text-muted">
            South Africa uses rand prices. International uses dollar list prices. Your billing country
            is set when you open a studio — this toggle only previews the catalog.
          </p>

          {catalog.length === 0 ? (
            <p className="mt-12 rounded-2xl border border-border bg-surface p-6 text-muted">
              The price list is empty in this environment. After a local database setup, run{" "}
              <code className="text-foreground">npm run db:seed:local</code>. We will not invent
              prices here.
            </p>
          ) : (
            <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {catalog.map((plan) => (
                <li
                  key={plan.id}
                  className={`flex flex-col rounded-2xl border p-6 ${
                    plan.highlighted ? "border-accent bg-surface" : "border-border bg-surface"
                  }`}
                >
                  {plan.highlighted ? (
                    <p className="text-[11px] font-medium tracking-[0.2em] text-accent">HIGHLIGHTED</p>
                  ) : null}
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">{plan.name}</h2>
                  <p className="mt-4 font-display text-4xl text-foreground">{plan.priceLabel}</p>
                  <p className="mt-2 text-muted">{plan.creditLabel}</p>
                  <Button
                    asChild
                    className="mt-8 rounded-full"
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    <Link href={ctaHref}>{ctaLabel}</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-10 max-w-2xl text-sm text-muted">
            Paying happens in Billing after you have an account. This page is the catalog only — it
            cannot charge a card.
          </p>
        </PublicFrame>
      </main>
    </PublicShell>
  );
}
