import type { Metadata } from "next";
import Link from "next/link";
import { HomeFrame } from "@/components/site/home-frame";
import { LightSection, PrimaryCta, SalesCtaBand, SalesPageHero } from "@/components/site/sales-sections";
import { PublicShell } from "@/components/site/public-shell";
import { RegionToggle } from "@/components/site/region-toggle";
import { StaticGraphic } from "@/components/site/static-graphic";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { listActivePlans, parsePricingRegion } from "@/lib/plans/queries";
import { HOME_ICONS } from "@/lib/site/home";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "One Ad Credit starts one new commercial production. Concept work before production does not use a credit.",
};

export const dynamic = "force-dynamic";

const FACTS = [
  {
    icon: HOME_ICONS.check,
    title: "1 Ad Credit = 1 production",
    body: "Each new commercial uses one credit. We do not offer unlimited generation or unlimited revisions.",
  },
  {
    icon: HOME_ICONS.salesScript,
    title: "Concept work is free",
    body: "The brief and commercial concept do not use a credit. You approve before we produce.",
  },
  {
    icon: HOME_ICONS.duration,
    title: "15s, 20s or 30s",
    body: "You choose the length. Delivery is Full HD after finishing.",
  },
] as const;

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
      <main>
        <SalesPageHero
          eyebrow="PLANS"
          title="Simple plans. One credit per production."
          description="One Ad Credit starts one new commercial production. Concept and script changes before production do not use a credit."
          actions={<PrimaryCta href={ctaHref}>{ctaLabel}</PrimaryCta>}
        />

        <LightSection>
          <HomeFrame>
            <ul className="grid gap-4 md:grid-cols-3">
              {FACTS.map((fact) => (
                <li
                  key={fact.title}
                  className="rounded-[1.6rem] border border-[#2787FF]/15 bg-white p-6 shadow-[0_16px_40px_rgba(17,26,49,0.06)]"
                >
                  <StaticGraphic src={fact.icon} alt="" width={24} height={24} className="size-6" />
                  <h2 className="mt-4 text-lg font-semibold text-[#111A31]">{fact.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#5A6480]">{fact.body}</p>
                </li>
              ))}
            </ul>

            <div className="mt-14">
              <RegionToggle region={region} />
              <p className="mt-3 max-w-2xl text-sm text-[#5A6480]">
                South Africa uses rand prices. International uses dollar list prices. Your billing country is set
                when you open a studio — this toggle only previews the catalog.
              </p>
            </div>

            {catalog.length === 0 ? (
              <p className="mt-12 rounded-[1.5rem] border border-[#111A31]/10 bg-white p-6 text-[#5A6480]">
                The price list is empty in this environment. After a local database setup, run{" "}
                <code className="text-[#111A31]">npm run db:seed:local</code>. We will not invent prices here.
              </p>
            ) : (
              <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {catalog.map((plan) => (
                  <li
                    key={plan.id}
                    className={cn(
                      "flex flex-col rounded-[1.6rem] border p-6 sm:p-8",
                      plan.highlighted
                        ? "border-[#2787FF] bg-white shadow-[0_24px_60px_rgba(39,135,255,0.16)]"
                        : "border-[#111A31]/10 bg-white shadow-[0_16px_40px_rgba(17,26,49,0.06)]",
                    )}
                  >
                    {plan.highlighted ? (
                      <p className="text-[11px] font-semibold tracking-[0.2em] text-accent-ink">FEATURED</p>
                    ) : (
                      <p className="text-[11px] font-semibold tracking-[0.2em] text-[#5A6480]">PLAN</p>
                    )}
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#111A31]">{plan.name}</h2>
                    <p className="mt-5 bg-gradient-to-r from-[#2787FF] to-[#A78BFF] bg-clip-text text-4xl font-semibold tracking-tight text-transparent">
                      {plan.priceLabel}
                    </p>
                    <p className="mt-3 text-[#5A6480]">{plan.creditLabel}</p>
                    <p className="mt-4 text-sm leading-6 text-[#5A6480]">
                      {plan.interval === "month"
                        ? "Billed monthly. Stopping a monthly plan is done through Help for now."
                        : "Pay once. Credits are granted after payment is confirmed."}
                    </p>
                    <Button asChild className="mt-8 rounded-full">
                      <Link href={ctaHref}>{ctaLabel}</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-10 max-w-2xl text-sm text-[#5A6480]">
              Paying happens in Billing after you have an account. This page is the catalog only — it cannot charge
              a card.
            </p>
          </HomeFrame>
        </LightSection>

        <SalesCtaBand />
      </main>
    </PublicShell>
  );
}
