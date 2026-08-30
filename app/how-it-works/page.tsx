import type { Metadata } from "next";
import { FaqList } from "@/components/site/faq-list";
import { HomeFrame } from "@/components/site/home-frame";
import { GhostCta, LightSection, PrimaryCta, SalesCtaBand, SalesPageHero } from "@/components/site/sales-sections";
import { StaticGraphic } from "@/components/site/static-graphic";
import { PublicShell } from "@/components/site/public-shell";
import { WorkTabs } from "@/components/site/work-tabs";
import { HOW_IT_WORKS_STEPS, VALUE_PROPS } from "@/lib/site/copy";
import { HOME_ICONS } from "@/lib/site/home";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Tell Production30 about your business, show us who you are, approve the concept, and receive a 30-second commercial starring you.",
};

const STEP_ICONS = [HOME_ICONS.offer, HOME_ICONS.play, HOME_ICONS.salesScript, HOME_ICONS.socialReady] as const;
const VALUE_ICONS = [
  HOME_ICONS.attention,
  HOME_ICONS.customers,
  HOME_ICONS.sales,
  HOME_ICONS.duration,
  HOME_ICONS.check,
] as const;

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <main>
        <SalesPageHero
          eyebrow="HOW IT WORKS"
          title="Four steps. No film crew."
          description="No editing. No prompting. No production experience required. You stay the face of the brand; we handle creative direction, production and finishing."
          actions={
            <>
              <PrimaryCta>Create my first video</PrimaryCta>
              <GhostCta href="/pricing">See plans</GhostCta>
            </>
          }
        />

        <LightSection>
          <HomeFrame>
            <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {HOW_IT_WORKS_STEPS.map((step, index) => (
                <li
                  key={step.number}
                  className="rounded-[1.6rem] border border-[#2787FF]/15 bg-white p-6 shadow-[0_16px_40px_rgba(17,26,49,0.06)]"
                >
                  <StaticGraphic src={STEP_ICONS[index]!} alt="" width={28} height={28} className="size-7" />
                  <p className="mt-5 text-[11px] font-semibold tracking-[0.22em] text-accent-ink">{step.number}</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#111A31]">{step.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-[#5A6480]">{step.body}</p>
                </li>
              ))}
            </ol>
            <div className="mt-16">
              <WorkTabs />
            </div>
          </HomeFrame>
        </LightSection>

        <section className="py-16 sm:py-24">
          <HomeFrame>
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              A production company in your browser.
            </h2>
            <ul className="mt-10 grid gap-4 md:grid-cols-2">
              {VALUE_PROPS.map((item, index) => (
                <li key={item.title} className="rounded-[1.5rem] border border-border bg-surface p-6">
                  <StaticGraphic src={VALUE_ICONS[index]!} alt="" width={24} height={24} className="size-6" />
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
                </li>
              ))}
            </ul>
          </HomeFrame>
        </section>

        <LightSection>
          <HomeFrame className="max-w-3xl">
            <h2 className="text-3xl font-semibold tracking-tight text-[#111A31] sm:text-4xl">Questions</h2>
            <FaqList className="mt-8" />
          </HomeFrame>
        </LightSection>

        <SalesCtaBand />
      </main>
    </PublicShell>
  );
}
