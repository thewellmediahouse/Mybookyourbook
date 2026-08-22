import type { Metadata } from "next";
import Link from "next/link";
import { SupportForm } from "@/components/help/support-form";
import { PageIntro } from "@/components/dashboard/page-intro";

export const metadata: Metadata = { title: "Help" };

const ARTICLES = [
  {
    title: "Getting Started",
    body: "Brief us about your business, show us who you are, approve the concept, then receive your commercial.",
    href: "/how-it-works",
    linkLabel: "How it works",
  },
  {
    title: "Creating a Good Reference Video",
    body: "Record or upload about 8 to 15 seconds, facing the camera in a quiet, well-lit room. Do not send video files by email.",
    href: "/dashboard/identity",
    linkLabel: "Your AI Identity",
  },
  {
    title: "Taking Reference Photos",
    body: "We need three stills: front, about 45° left, and about 45° right. Face clear, shoulders visible, no sunglasses or filters.",
    href: "/dashboard/identity",
    linkLabel: "Your AI Identity",
  },
  {
    title: "Understanding Ad Credits",
    body: "One Ad Credit starts one new commercial production. Concept work before production does not use a credit.",
    href: "/pricing",
    linkLabel: "Pricing",
  },
  {
    title: "Why Branding Is Added Afterwards",
    body: "Your logo and on-screen text are applied after the commercial is filmed, so spelling and placement stay exact.",
  },
  {
    title: "Downloading Your Video",
    body: "Download appears on a finished commercial. There is no file to download until a commercial is ready.",
  },
] as const;

export default function HelpPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 lg:py-16">
      <PageIntro
        kicker="HELP"
        title="Help & Support"
        description="Short answers for the studio. Send us a message if you need help, including reports of impersonation."
      />
      <ul className="mt-10 grid gap-4">
        {ARTICLES.map((article) => (
          <li key={article.title} className="rounded-lg border border-border bg-surface p-5">
            <h2 className="font-display text-2xl text-foreground">{article.title}</h2>
            <p className="mt-3 text-muted">{article.body}</p>
            {"href" in article ? (
              <Link href={article.href} className="mt-4 inline-flex min-h-11 items-center text-foreground underline">
                {article.linkLabel}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="mt-10">
        <h2 className="font-display text-2xl text-foreground">Contact us</h2>
        <SupportForm />
      </div>
    </main>
  );
}
