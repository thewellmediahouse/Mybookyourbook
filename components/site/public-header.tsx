"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteLogo } from "@/components/brand/site-logo";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/examples", label: "Examples" },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="relative mx-auto flex w-full max-w-[88rem] items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link href="/" aria-label="Production30 home" className="shrink-0 rounded-xl bg-overlay-text px-2 py-1">
          <SiteLogo priority className="h-11 w-auto" />
        </Link>
        <nav
          aria-label="Primary"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 text-sm text-muted md:flex"
        >
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-muted transition-colors hover:text-foreground md:inline"
          >
            Sign in
          </Link>
          <Button asChild className="hidden rounded-full px-5 md:inline-flex">
            <Link href="/signup">Create My Advert</Link>
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
          className="flex flex-col gap-1 border-t border-border px-5 py-4 md:hidden"
        >
          {links.map((link) => (
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
            <Link href="/signup">Create My Advert</Link>
          </Button>
        </nav>
      ) : null}
    </header>
  );
}
