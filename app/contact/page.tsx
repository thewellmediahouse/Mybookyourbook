import type { Metadata } from "next";
import Link from "next/link";
import { HomeFrame } from "@/components/site/home-frame";
import { PublicContactForm } from "@/components/site/public-contact-form";
import { LightSection, PrimaryCta, SalesCtaBand, SalesPageHero } from "@/components/site/sales-sections";
import { PublicShell } from "@/components/site/public-shell";
import { StaticGraphic } from "@/components/site/static-graphic";
import { HOME_ICONS } from "@/lib/site/home";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Send Production30 a message. We'll email you back.",
};

export default function ContactPage() {
  return (
    <PublicShell>
      <main>
        <SalesPageHero
          eyebrow="CONTACT US"
          title="Send us a message"
          description="Tell us how we can help. We'll email you back. If you already have a studio, you can also write from Help after you sign in."
          actions={<PrimaryCta href="/signup">Create my first video</PrimaryCta>}
        />

        <LightSection>
          <HomeFrame className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            <div className="rounded-[1.75rem] border border-[#2787FF]/15 bg-white p-6 shadow-[0_18px_50px_rgba(17,26,49,0.08)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-[#111A31]">Write to the studio</h2>
              <p className="mt-2 text-sm leading-6 text-[#5A6480]">
                Use this form if you are not signed in yet. We reply by email.
              </p>
              <PublicContactForm />
            </div>
            <aside className="flex flex-col gap-4">
              <div className="rounded-[1.5rem] border border-[#2787FF]/15 bg-white p-6">
                <StaticGraphic src={HOME_ICONS.enquiries} alt="" width={24} height={24} className="size-6" />
                <h2 className="mt-4 text-lg font-semibold text-[#111A31]">Already a customer?</h2>
                <p className="mt-2 text-sm leading-6 text-[#5A6480]">
                  Sign in and open Help. That keeps your studio and commercial attached to the ticket.
                </p>
                <Link href="/login" className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-[#111A31] underline">
                  Sign in
                </Link>
              </div>
              <div className="rounded-[1.5rem] border border-[#2787FF]/15 bg-white p-6">
                <StaticGraphic src={HOME_ICONS.sales} alt="" width={24} height={24} className="size-6" />
                <h2 className="mt-4 text-lg font-semibold text-[#111A31]">Plans and credits</h2>
                <p className="mt-2 text-sm leading-6 text-[#5A6480]">
                  See the catalog first. Buying happens in Billing after you have an account.
                </p>
                <Link href="/pricing" className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-[#111A31] underline">
                  View plans
                </Link>
              </div>
            </aside>
          </HomeFrame>
        </LightSection>

        <SalesCtaBand />
      </main>
    </PublicShell>
  );
}
