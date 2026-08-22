import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/site/page-intro";
import { PublicFrame } from "@/components/site/public-frame";
import { PublicShell } from "@/components/site/public-shell";
import { VideoCard } from "@/components/site/video-card";
import { Button } from "@/components/ui/button";
import { HOW_IT_WORKS_STEPS } from "@/lib/site/copy";
import { EXAMPLE_CLIPS } from "@/lib/site/example-videos";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Tell Production30 about your business, show us who you are, approve the concept, and receive a Full-HD commercial.",
};

export default function HowItWorksPage() {
  return (
    <PublicShell>
      <main className="pb-20 sm:pb-28">
        <PageIntro
          eyebrow="HOW IT WORKS"
          title="Four steps. No film crew."
          description="No editing. No prompting. No production experience required. You stay the face of the brand; we handle creative direction, production and finishing."
          actions={
            <>
              <Button asChild size="lg" className="rounded-full px-7">
                <Link href="/signup">Create My Advert</Link>
              </Button>
              <Link
                href="/pricing"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-border px-6 text-base font-medium text-foreground hover:bg-surface"
              >
                See pricing
              </Link>
            </>
          }
        />
        <PublicFrame className="mt-10 grid gap-4 md:grid-cols-2">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <VideoCard
              key={step.number}
              src={EXAMPLE_CLIPS[index % EXAMPLE_CLIPS.length]!.src}
              title={`${step.number}  ${step.title}`}
              subtitle={step.body}
              className="aspect-[16/10] min-h-[18rem]"
            />
          ))}
        </PublicFrame>
      </main>
    </PublicShell>
  );
}
