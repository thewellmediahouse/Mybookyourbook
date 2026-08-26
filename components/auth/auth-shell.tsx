import Link from "next/link";
import type { ReactNode } from "react";
import { SiteLogo } from "@/components/brand/site-logo";

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
    <div data-theme="public" className="flex min-h-svh flex-1 flex-col bg-background">
      <header className="border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[88rem] px-5 py-3 sm:px-8">
          <Link href="/" aria-label="Production30 home">
            <span className="inline-flex rounded-xl bg-overlay-text px-2 py-1">
              <SiteLogo className="h-10 w-auto" />
            </span>
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <h1 className="font-display text-3xl tracking-tight text-foreground">{title}</h1>
        <p className="mt-3 text-muted">{description}</p>
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
