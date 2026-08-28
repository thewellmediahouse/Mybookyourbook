import Link from "next/link";
import type { ReactNode } from "react";
import { SiteLogo } from "@/components/brand/site-logo";
import { PhoneStage } from "@/components/site/phone-stage";
import { HOME_BACKGROUNDS, HOME_IMAGES } from "@/lib/site/home";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div data-theme="sales" className="relative flex min-h-svh flex-1 flex-col overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${HOME_BACKGROUNDS.heroAurora})` }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-[#071225]/82" aria-hidden />
      <header className="relative z-10">
        <div className="mx-auto flex w-full max-w-[80rem] px-5 py-3 sm:px-8">
          <Link href="/" aria-label="Production30 home">
            <span className="inline-flex rounded-xl bg-overlay-text px-2 py-1">
              <SiteLogo className="h-10 w-auto" />
            </span>
          </Link>
        </div>
      </header>
      <div className="relative z-10 mx-auto grid w-full max-w-[80rem] flex-1 items-center gap-12 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        <main>
          <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">{title}</h1>
          <p className="mt-3 text-muted">{description}</p>
          <div className="mt-8 rounded-[1.6rem] border border-border bg-surface/80 p-6 backdrop-blur-xl">{children}</div>
        </main>
        <aside className="hidden justify-center lg:flex">
          <PhoneStage
            src={HOME_IMAGES.heroFinishedAd}
            alt="A finished Production30 advert on a phone, starring the business owner"
            objectPosition="50% 42%"
            label="FINISHED AD"
          />
        </aside>
      </div>
    </div>
  );
}
