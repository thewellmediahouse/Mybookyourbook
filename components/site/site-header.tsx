import Link from "next/link";
import type { ReactNode } from "react";
import { SiteLogo } from "@/components/brand/site-logo";

export function SiteHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" aria-label="Production30 home">
          <SiteLogo priority className="h-11 w-auto" />
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-6 text-sm text-muted">
          {children}
        </nav>
      </div>
    </header>
  );
}
