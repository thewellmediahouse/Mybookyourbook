import type { ReactNode } from "react";
import { PromoBanner } from "./promo-banner";
import { PublicFooter } from "./public-footer";
import { PublicHeader } from "./public-header";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div data-theme="public" className="flex min-h-svh flex-1 flex-col bg-background">
      <PromoBanner />
      <PublicHeader />
      {children}
      <PublicFooter />
    </div>
  );
}
