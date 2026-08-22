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
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[88rem] items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link href="/" aria-label="Production30 home" className="shrink-0">
          <SiteLogo priority className="h-11 w-auto" />
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-7 text-sm text-muted md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="px-2 text-sm text-muted transition-colors hover:text-foreground">
            Sign in
          </Link>
          <Button asChild className="rounded-full px-5">
            <Link href="/signup">Create My Advert</Link>
          </Button>
        </div>
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
