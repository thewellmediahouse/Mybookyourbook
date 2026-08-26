import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/site/page-intro";
import { PublicFrame } from "@/components/site/public-frame";
import { PublicShell } from "@/components/site/public-shell";
import { VideoCard } from "@/components/site/video-card";
import { Button } from "@/components/ui/button";
import { AD_CLIPS, EXAMPLE_DISCLAIMER, PLACE_CLIPS } from "@/lib/site/example-videos";

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
          description="A finished Production30 commercial is a 30-second Full-HD business advert with you on camera, talking through the offer. Browse the look below, then start yours."
          actions={
            <Button asChild size="lg" className="rounded-full px-7">
              <Link href="/signup">Create My Advert</Link>
            </Button>
          }
        />
        <PublicFrame className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Product ads. People talking.
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AD_CLIPS.map((clip) => (
              <VideoCard
                key={clip.id}
                src={clip.src}
                title={clip.title}
                subtitle={clip.subtitle}
                className="aspect-video min-h-0 rounded-[1.75rem] shadow-[0_20px_50px_rgba(0,16,56,0.35)]"
              />
            ))}
          </div>
          <h2 className="mt-14 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Places and craft</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLACE_CLIPS.map((clip) => (
              <VideoCard
                key={clip.id}
                src={clip.src}
                title={clip.title}
                subtitle={clip.subtitle}
                className="aspect-video min-h-0 rounded-[1.75rem] shadow-[0_20px_50px_rgba(0,16,56,0.35)]"
              />
            ))}
          </div>
        </PublicFrame>
        <PublicFrame className="mt-8 max-w-2xl">
          <p className="text-sm leading-6 text-muted">{EXAMPLE_DISCLAIMER}</p>
        </PublicFrame>
      </main>
    </PublicShell>
  );
}
