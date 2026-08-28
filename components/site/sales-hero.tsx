import Link from "next/link";
import { HeroPhoneSequence } from "@/components/site/hero-phone-sequence";
import { HomeFrame } from "@/components/site/home-frame";
import { Button } from "@/components/ui/button";
import { HOME_BACKGROUNDS, HOME_HERO, HOME_ICONS } from "@/lib/site/home";
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
          <HeroPhoneSequence />

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
