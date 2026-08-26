import Link from "next/link";
import { FaqList } from "@/components/site/faq-list";
import { HeroVideo } from "@/components/site/hero-video";
import { PublicFrame } from "@/components/site/public-frame";
import { PublicShell } from "@/components/site/public-shell";
import { VideoCard } from "@/components/site/video-card";
import { VideoRail } from "@/components/site/video-rail";
import { WorkTabs } from "@/components/site/work-tabs";
import { Button } from "@/components/ui/button";
import { VALUE_PROPS } from "@/lib/site/copy";
import {
  AD_CLIPS,
  EXAMPLE_DISCLAIMER,
  HERO_CLIP,
  PLACE_CLIPS,
} from "@/lib/site/example-videos";

export default function Home() {
  return (
    <PublicShell>
      <main className="flex flex-col pb-20 sm:pb-28">
        <section className="pt-14 sm:pt-20">
          <PublicFrame className="max-w-4xl text-center">
            <p className="text-[11px] font-medium tracking-[0.22em] text-accent-ink">
              30-SECOND COMMERCIALS
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Your business.
              <br />
              Starring you.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
              A professional Full-HD advert without a film crew. Tell us about the business, show us
              who you are, approve the concept, and receive the finished commercial.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full px-7">
                <Link href="/signup">Create My Advert</Link>
              </Button>
              <Link
                href="/examples"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-border px-6 text-base font-medium text-foreground hover:bg-surface"
              >
                Watch product ads
              </Link>
            </div>
          </PublicFrame>
          <PublicFrame className="mt-12 max-w-5xl sm:mt-14">
            <HeroVideo src={HERO_CLIP.src} />
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-6 text-muted">
              {HERO_CLIP.subtitle}
            </p>
          </PublicFrame>
        </section>

        <div className="mt-16 sm:mt-20">
          <VideoRail title="Product ads. People talking." clips={AD_CLIPS} />
        </div>

        <section className="mt-20 sm:mt-28">
          <PublicFrame>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              One studio. Four steps.
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-muted">
              No editing. No prompting. No production experience required.
            </p>
            <div className="mt-10">
              <WorkTabs />
            </div>
          </PublicFrame>
        </section>

        <div className="mt-20 sm:mt-28">
          <VideoRail title="The look" clips={PLACE_CLIPS} />
        </div>

        <section className="mt-20 sm:mt-28">
          <PublicFrame className="grid gap-4 md:grid-cols-2">
            {VALUE_PROPS.slice(0, 4).map((item, index) => (
              <VideoCard
                key={item.title}
                src={AD_CLIPS[index % AD_CLIPS.length]!.src}
                title={item.title}
                subtitle={item.body}
                className="aspect-[16/10] min-h-[16rem] rounded-[1.75rem] shadow-[0_24px_60px_rgba(0,16,56,0.35)]"
              />
            ))}
          </PublicFrame>
        </section>

        <section className="mt-20 sm:mt-28">
          <PublicFrame>
            <div className="rounded-[1.75rem] bg-overlay px-6 py-14 text-center sm:px-12 sm:py-16">
              <h2 className="text-3xl font-semibold tracking-tight text-overlay-text sm:text-5xl">
                See what Production30 can do for your business
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-overlay-muted">
                Concept work is free. One Ad Credit starts one new commercial.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full px-7">
                  <Link href="/signup">Get started today</Link>
                </Button>
                <Link
                  href="/pricing"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-overlay-muted/40 px-6 text-base font-medium text-overlay-text hover:bg-white/5"
                >
                  Find your plan
                </Link>
              </div>
            </div>
          </PublicFrame>
        </section>

        <section className="mt-20 sm:mt-28">
          <PublicFrame className="max-w-3xl">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Questions
            </h2>
            <div className="mt-8">
              <FaqList />
            </div>
            <p className="mt-8 text-sm leading-6 text-muted">{EXAMPLE_DISCLAIMER}</p>
          </PublicFrame>
        </section>
      </main>
    </PublicShell>
  );
}
