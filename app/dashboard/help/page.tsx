import type { Metadata } from "next";
import Link from "next/link";
import { CustomerReplyForm } from "@/components/help/customer-reply-form";
import { SupportForm } from "@/components/help/support-form";
import { PageIntro } from "@/components/dashboard/page-intro";
import { formatStudioDate } from "@/lib/dashboard/format";
import { requireStudio } from "@/lib/dashboard/studio";
import { canCustomerReply, listWorkspaceSupportThreads } from "@/lib/security/support";

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
    title: "When an Ad Credit comes back",
    body: "If we cannot finish a commercial, that Ad Credit is added back to your studio. You were not charged extra, and you can start that production again.",
    href: "/dashboard/credits",
    linkLabel: "Ad Credits",
  },
  {
    title: "When money comes back",
    body: "If you paid and want the money returned, send a Refund request from this page. We review it and, if we agree, return the money through the same card payment. That is separate from an Ad Credit coming back.",
  },
  {
    title: "Cancel a monthly plan",
    body: "Monthly plans are not open for self-serve cancel yet. Send a Cancel plan message from this page. We will stop the plan at the end of the current period.",
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

export default async function HelpPage() {
  const studio = await requireStudio();
  const threads = await listWorkspaceSupportThreads(studio.db, studio.active.workspaceId);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 lg:py-16">
      <PageIntro
        kicker="HELP"
        title="Help & Support"
        description="Short answers for the studio. Send us a message if you need help, including refund requests, cancelling a plan, or reports of impersonation."
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
      {threads.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-2xl text-foreground">Your messages</h2>
          <ul className="mt-4 grid gap-4">
            {threads.map((ticket) => (
              <li key={ticket.id} className="rounded-lg border border-border bg-surface p-5">
                <p className="text-sm text-muted">
                  {ticket.category} · {ticket.status} · {formatStudioDate(ticket.createdAt)}
                </p>
                <h3 className="mt-2 font-display text-xl text-foreground">{ticket.subject}</h3>
                <p className="mt-3 whitespace-pre-wrap text-foreground">{ticket.message}</p>
                {ticket.replies.map((reply) => (
                  <div key={reply.id} className="mt-4 border-t border-border pt-4">
                    <p className="text-sm text-muted">
                      {reply.authorRole === "staff" ? "Production30" : "You"} · {formatStudioDate(reply.createdAt)}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-foreground">{reply.body}</p>
                  </div>
                ))}
                {canCustomerReply(ticket.status) ? <CustomerReplyForm ticketId={ticket.id} /> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <div className="mt-10">
        <h2 className="font-display text-2xl text-foreground">Contact us</h2>
        <SupportForm />
      </div>
    </main>
  );
}
