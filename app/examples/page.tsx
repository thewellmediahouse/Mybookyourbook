import type { Metadata } from "next";
import { CreationChoices } from "@/components/site/creation-choices";
import { HomeFrame } from "@/components/site/home-frame";
import { GhostCta, LightSection, PrimaryCta, SalesCtaBand, SalesPageHero } from "@/components/site/sales-sections";
import { PublicShell } from "@/components/site/public-shell";
import { StyleCarousel } from "@/components/site/style-carousel";
import { VideoCard } from "@/components/site/video-card";
import { AD_CLIPS, EXAMPLE_DISCLAIMER, PLACE_CLIPS } from "@/lib/site/example-videos";

export const metadata: Metadata = {
  title: "Examples",
  description:
    "The cinematic look of a Production30 commercial. Style references, not made-up customer work.",
};

export default function ExamplesPage() {
  return (
    <PublicShell>
      <main>
        <SalesPageHero
          eyebrow="THE LOOK"
          title="Cinematic. 30 seconds. Starring you."
          description="A finished Production30 commercial is a 30-second Full-HD business advert with you on camera, talking through the offer. These clips are style references — not customer testimonials."
          actions={
            <>
              <PrimaryCta>Create my first video</PrimaryCta>
              <GhostCta href="/how-it-works">See how it works</GhostCta>
            </>
          }
        />

        <CreationChoices />

        <section className="py-16 sm:py-24">
          <HomeFrame>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Product ads. People talking.
            </h2>
            <p className="mt-3 max-w-xl text-muted">The energy we aim for: a person, a product, a clear offer.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            <h2 className="mt-16 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Places and craft</h2>
            <p className="mt-3 max-w-xl text-muted">Real rooms, real work, still enough to hold a 30-second story.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          </HomeFrame>
        </section>

        <StyleCarousel />

        <LightSection className="py-12 sm:py-16">
          <HomeFrame className="max-w-2xl">
            <p className="text-sm leading-6 text-[#5A6480]">{EXAMPLE_DISCLAIMER}</p>
          </HomeFrame>
        </LightSection>

        <SalesCtaBand />
      </main>
    </PublicShell>
  );
}
