import type { Metadata } from "next";
import { PageIntro } from "@/components/site/page-intro";
import { PublicContactForm } from "@/components/site/public-contact-form";
import { PublicFrame } from "@/components/site/public-frame";
import { PublicShell } from "@/components/site/public-shell";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Send Production30 a message. We'll email you back.",
};

export default function ContactPage() {
  return (
    <PublicShell>
      <main className="pb-20 sm:pb-28">
        <PageIntro
          eyebrow="CONTACT US"
          title="Send us a message"
          description="Tell us how we can help. We'll email you back. If you already have a studio, you can also write from Help after you sign in."
        />
        <PublicFrame>
          <PublicContactForm />
        </PublicFrame>
      </main>
    </PublicShell>
  );
}
