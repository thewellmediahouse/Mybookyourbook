import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/site/page-intro";
import { PublicFrame } from "@/components/site/public-frame";
import { PublicShell } from "@/components/site/public-shell";
import { VideoCard } from "@/components/site/video-card";
import { Button } from "@/components/ui/button";
import { EXAMPLE_CLIPS, EXAMPLE_DISCLAIMER } from "@/lib/site/example-videos";

export const metadata: Metadata = {
  title: "Examples",
  description:
    "The cinematic look of a Production30 commercial. Style references, not made-up customer work.",
};

export default function ExamplesPage() {
  return (
    <PublicShell>
      <main className="pb-20 sm:pb-28">
        <PageIntro
          eyebrow="THE LOOK"
          title="Cinematic. 30 seconds. Starring you."
          description="A finished Production30 commercial is a 30-second Full-HD business advert with you on camera. Browse the look below, then start yours."
          actions={
            <Button asChild size="lg" className="rounded-full px-7">
              <Link href="/signup">Create My Advert</Link>
            </Button>
          }
        />
        <PublicFrame className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXAMPLE_CLIPS.map((clip) => (
            <VideoCard
              key={clip.id}
              src={clip.src}
              title={clip.title}
              subtitle={clip.subtitle}
              className="aspect-video min-h-0"
            />
          ))}
        </PublicFrame>
        <PublicFrame className="mt-8 max-w-2xl">
          <p className="text-sm leading-6 text-muted">{EXAMPLE_DISCLAIMER}</p>
        </PublicFrame>
      </main>
    </PublicShell>
  );
}
