import Link from "next/link";
import { PhoneStage } from "@/components/site/phone-stage";
import { HomeFrame } from "@/components/site/home-frame";
import { Button } from "@/components/ui/button";
import { HOME_BACKGROUNDS, HOME_FINAL, HOME_ICONS, HOME_IMAGES } from "@/lib/site/home";
import { StaticGraphic } from "@/components/site/static-graphic";

export function FinalSalesCta() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${HOME_BACKGROUNDS.finalCtaFlow})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-[#071225]/70" aria-hidden />
      <HomeFrame className="relative grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="max-w-xl">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">{HOME_FINAL.heading}</h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted sm:text-lg">{HOME_FINAL.body}</p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="rounded-full px-7">
              <Link href={HOME_FINAL.primary.href}>{HOME_FINAL.primary.label}</Link>
            </Button>
            <Link
              href={HOME_FINAL.secondary.href}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-border px-6 text-base font-medium text-foreground hover:bg-surface"
            >
              {HOME_FINAL.secondary.label}
            </Link>
          </div>
        </div>
        <div className="relative mx-auto w-[13.5rem] sm:w-[15.5rem]">
          <div className="origin-center rotate-[8deg]">
            <PhoneStage
              src={HOME_IMAGES.finalCtaAd}
              alt="A finished vertical advert starring a business owner with a product"
              objectPosition="50% 42%"
            />
          </div>
          <StaticGraphic
            src={HOME_ICONS.play}
            alt=""
            className="absolute -left-6 top-10 size-14 drop-shadow-lg sm:-left-8"
          />
          <StaticGraphic
            src={HOME_ICONS.growth}
            alt=""
            className="absolute -right-5 top-24 size-14 drop-shadow-lg sm:-right-8"
          />
          <StaticGraphic
            src={HOME_ICONS.cart}
            alt=""
            className="absolute bottom-16 -left-4 size-14 drop-shadow-lg sm:-left-6"
          />
        </div>
      </HomeFrame>
    </section>
  );
}
