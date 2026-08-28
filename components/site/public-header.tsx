"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SiteLogo } from "@/components/brand/site-logo";
import { Button } from "@/components/ui/button";
import { HOME_HERO, HOME_NAV } from "@/lib/site/home";
import { cn } from "@/lib/utils";

export function PublicHeader({
  overlay = true,
  ctaLabel,
}: {
  overlay?: boolean;
  ctaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const cta = ctaLabel ?? HOME_HERO.headerCta;

  return (
    <header
      className={cn(
        "z-50 sticky top-0",
        overlay ? "bg-[#071225]/55 backdrop-blur-xl" : "border-b border-border/80 bg-background/90 backdrop-blur-xl",
      )}
    >
      <div className="relative mx-auto flex w-full max-w-[80rem] items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link href="/" aria-label="Production30 home" className="shrink-0 rounded-xl bg-overlay-text px-2 py-1">
          <SiteLogo priority className="h-11 w-auto" />
        </Link>
        <nav
          aria-label="Primary"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 text-sm text-muted md:flex"
        >
          {HOME_NAV.map((link) => {
            const current = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "transition-colors hover:text-foreground",
                  current ? "text-foreground" : undefined,
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-muted transition-colors hover:text-foreground md:inline"
          >
            Sign in
          </Link>
          <Button asChild className="hidden rounded-full px-5 md:inline-flex">
            <Link href="/signup">{cta}</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Close" : "Menu"}
          </Button>
        </div>
      </div>
      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="flex flex-col gap-1 border-t border-border bg-background/95 px-5 py-4 backdrop-blur-xl md:hidden"
        >
          {HOME_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center text-foreground"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/login" className="inline-flex min-h-11 items-center text-foreground">
            Sign in
          </Link>
          <Button asChild className="mt-2 w-full rounded-full">
            <Link href="/signup">{cta}</Link>
          </Button>
        </nav>
      ) : null}
    </header>
  );
}
