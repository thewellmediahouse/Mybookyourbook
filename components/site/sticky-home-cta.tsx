import Link from "next/link";
import { HOME_HERO } from "@/lib/site/home";

export function StickyHomeCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur-xl md:hidden">
      <Link
        href="/signup"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-accent-foreground"
      >
        {HOME_HERO.headerCta}
      </Link>
    </div>
  );
}
