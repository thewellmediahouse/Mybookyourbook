import Link from "next/link";
import { PhoneStage } from "@/components/site/phone-stage";
import { HomeFrame } from "@/components/site/home-frame";
import { Button } from "@/components/ui/button";
import { HOME_BACKGROUNDS, HOME_HERO, HOME_ICONS, HOME_IMAGES, HOME_UI } from "@/lib/site/home";
import { StaticGraphic } from "@/components/site/static-graphic";

export function SalesHero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-10 sm:pb-28 sm:pt-14">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${HOME_BACKGROUNDS.heroAurora})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-[#071225]/78" aria-hidden />
      <HomeFrame className="relative grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,34rem)] lg:gap-8">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold tracking-[0.26em] text-accent-ink">{HOME_HERO.eyebrow}</p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]">
            {HOME_HERO.headlineBefore}{" "}
            <span className="bg-gradient-to-r from-[#2787FF] to-[#A78BFF] bg-clip-text text-transparent">
              {HOME_HERO.headlineAccent}
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-muted sm:text-lg sm:leading-8">{HOME_HERO.body}</p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="rounded-full px-7">
              <Link href={HOME_HERO.primary.href}>{HOME_HERO.primary.label}</Link>
            </Button>
            <Link
              href={HOME_HERO.secondary.href}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-border px-6 text-base font-medium text-foreground hover:bg-surface"
            >
              {HOME_HERO.secondary.label}
            </Link>
          </div>
          <ul className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6">
            {HOME_HERO.trust.map((item) => (
              <li key={item} className="flex min-h-11 items-center gap-2 text-sm text-foreground">
                <StaticGraphic src={HOME_ICONS.check} alt="" width={18} height={18} className="size-[18px] shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-[36rem]">
          <div className="flex items-end justify-center gap-2 sm:gap-4">
            <PhoneStage
              src={HOME_IMAGES.heroSelfie}
              alt="A business owner recording a simple selfie on a phone"
              objectPosition="50% 45%"
              priority
              label="YOUR SELFIE"
            >
              <div className="absolute inset-x-0 bottom-5 flex justify-center" aria-hidden>
                <span className="inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5">
                  <span className="size-2 rounded-full bg-[#E06565]" />
                  <span className="h-1 w-10 rounded-full bg-white/70" />
                </span>
              </div>
            </PhoneStage>

            <StaticGraphic
              src={HOME_UI.transformationRibbon}
              alt=""
              className="sales-ribbon pointer-events-none absolute left-1/2 top-[42%] z-10 hidden w-[min(42%,11rem)] -translate-x-1/2 sm:block"
            />

            <PhoneStage
              src={HOME_IMAGES.heroFinishedAd}
              alt="The same person presenting a finished professional advert on a phone"
              objectPosition="50% 42%"
              priority
              label="FINISHED AD"
            >
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-4 pb-7 pt-16 text-left">
                <p className="text-sm font-semibold leading-5 text-[#F7F8FC]">Premium skincare.</p>
                <p className="text-sm font-semibold leading-5 text-[#F7F8FC]">Real results.</p>
                <p className="mt-1 text-[11px] leading-4 text-[#F7F8FC]/90">
                  Made with natural ingredients your customers will love.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex min-h-8 items-center rounded-full bg-[#2787FF] px-3 text-[11px] font-semibold text-[#001038]">
                    Shop now
                  </span>
                  <span className="text-[11px] font-medium text-[#F7F8FC]">30 sec</span>
                </div>
              </div>
            </PhoneStage>
          </div>

          <ul className="mt-5 hidden justify-end gap-2 lg:flex">
            {HOME_HERO.chips.map((chip) => (
              <li
                key={chip.label}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 text-xs text-foreground backdrop-blur-md"
              >
                <StaticGraphic src={chip.icon} alt="" width={16} height={16} className="size-4" />
                {chip.label}
              </li>
            ))}
          </ul>
        </div>
      </HomeFrame>
    </section>
  );
}
