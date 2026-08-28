import type { ReactNode } from "react";
import Link from "next/link";
import { HomeFrame } from "@/components/site/home-frame";
import { Button } from "@/components/ui/button";
import { HOME_BACKGROUNDS, HOME_FINAL, HOME_HERO } from "@/lib/site/home";
import { cn } from "@/lib/utils";

export function SalesPageHero({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden pb-16 pt-10 sm:pb-20 sm:pt-14">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${HOME_BACKGROUNDS.heroAurora})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-[#071225]/80" aria-hidden />
      <HomeFrame className="relative max-w-3xl">
        <p className="text-[11px] font-semibold tracking-[0.26em] text-accent-ink">{eyebrow}</p>
        <h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">{description}</p>
        {actions ? <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">{actions}</div> : null}
      </HomeFrame>
    </section>
  );
}

export function LightSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("sales-light relative overflow-hidden py-16 sm:py-24", className)}>
      <div
        className="absolute inset-0 bg-cover bg-center opacity-35"
        style={{ backgroundImage: `url(${HOME_BACKGROUNDS.lightFlow})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-[#F7F8FC]" aria-hidden />
      <div className="relative">{children}</div>
    </section>
  );
}

export function SalesCtaBand() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${HOME_BACKGROUNDS.finalCtaFlow})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-[#071225]/72" aria-hidden />
      <HomeFrame className="relative max-w-3xl text-center sm:text-left">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">{HOME_FINAL.heading}</h2>
        <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg">{HOME_FINAL.body}</p>
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
      </HomeFrame>
    </section>
  );
}

export function PrimaryCta({ href = "/signup", children = HOME_HERO.primary.label }: { href?: string; children?: ReactNode }) {
  return (
    <Button asChild size="lg" className="rounded-full px-7">
      <Link href={href}>{children}</Link>
    </Button>
  );
}

export function GhostCta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 items-center justify-center rounded-full border border-border px-6 text-base font-medium text-foreground hover:bg-surface"
    >
      {children}
    </Link>
  );
}
