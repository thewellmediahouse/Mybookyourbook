import type { ReactNode } from "react";
import { PromoBanner } from "./promo-banner";
import { PublicFooter } from "./public-footer";
import { PublicHeader } from "./public-header";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <PromoBanner />
      <PublicHeader />
      {children}
      <PublicFooter />
    </div>
  );
}
