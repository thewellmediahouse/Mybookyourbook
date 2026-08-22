import Link from "next/link";
import { FaqList } from "@/components/site/faq-list";
import { PageIntro, TextLink } from "@/components/site/page-intro";
import { PublicFrame } from "@/components/site/public-frame";
import { PublicShell } from "@/components/site/public-shell";
import { VideoCard } from "@/components/site/video-card";
import { VideoRail } from "@/components/site/video-rail";
import { Button } from "@/components/ui/button";
import { HOW_IT_WORKS_STEPS, VALUE_PROPS } from "@/lib/site/copy";
import { EXAMPLE_CLIPS, EXAMPLE_DISCLAIMER } from "@/lib/site/example-videos";

const HERO = EXAMPLE_CLIPS[0]!;
const LOOK = EXAMPLE_CLIPS.slice(0, 5);
const MORE = EXAMPLE_CLIPS.slice(5);

export default function Home() {
  return (
    <PublicShell>
      <main className="flex flex-col gap-16 pb-20 sm:gap-20 sm:pb-28">
        <section className="relative isolate min-h-[78vh] overflow-hidden">
          <video
            className="absolute inset-0 size-full object-cover"
            src={HERO.src}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/25" />
          <PublicFrame className="relative flex min-h-[78vh] flex-col justify-end pb-16 pt-24">
            <p className="text-[11px] font-medium tracking-[0.22em] text-accent">30-SECOND COMMERCIALS</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              Your business. Starring you.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg">
              A professional Full-HD advert without a film crew. Tell us about the business, show us who you
              are, approve the concept, and receive the finished commercial.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="rounded-full px-7">
                <Link href="/signup">Create My Advert</Link>
              </Button>
              <Link
                href="/examples"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-border px-6 text-base font-medium text-foreground hover:bg-surface"
              >
                Watch the look
              </Link>
            </div>
          </PublicFrame>
        </section>

        <VideoRail title="The look" clips={LOOK} />

        <section>
          <PublicFrame>
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Four steps. No film crew.
            </h2>
            <ol className="mt-6 grid gap-3 md:grid-cols-2">
              {HOW_IT_WORKS_STEPS.map((step) => (
                <li key={step.number} className="rounded-2xl border border-border bg-surface p-5">
                  <p className="text-[11px] font-medium tracking-[0.2em] text-accent">{step.number}</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{step.title}</p>
                  <p className="mt-1.5 text-sm leading-6 text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </PublicFrame>
        </section>

        {MORE.length > 0 ? <VideoRail title="More style references" clips={MORE} /> : null}

        <section>
          <PublicFrame className="grid gap-4 md:grid-cols-2">
            {VALUE_PROPS.slice(0, 4).map((item, index) => (
              <VideoCard
                key={item.title}
                src={EXAMPLE_CLIPS[index % EXAMPLE_CLIPS.length]!.src}
                title={item.title}
                subtitle={item.body}
                className="aspect-[16/10] min-h-[16rem]"
              />
            ))}
          </PublicFrame>
        </section>

        <PageIntro
          className="pt-0"
          title="Ready when you are."
          description="Concept work is free. One Ad Credit starts one new commercial."
          actions={
            <>
              <Button asChild size="lg" className="rounded-full px-7">
                <Link href="/signup">Create My Advert</Link>
              </Button>
              <TextLink href="/how-it-works">See how it works</TextLink>
            </>
          }
        />

        <section>
          <PublicFrame className="max-w-3xl">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Questions</h2>
            <div className="mt-6">
              <FaqList />
            </div>
            <p className="mt-8 text-sm leading-6 text-muted">{EXAMPLE_DISCLAIMER}</p>
          </PublicFrame>
        </section>
      </main>
    </PublicShell>
  );
}
