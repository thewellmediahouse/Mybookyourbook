import type { ReactNode } from "react";
import { PromoBanner } from "./promo-banner";
import { PublicFooter } from "./public-footer";
import { PublicHeader } from "./public-header";

export function PublicShell({
  children,
  promo = false,
  theme = "sales",
  headerCta,
}: {
  children: ReactNode;
  promo?: boolean;
  theme?: "public" | "sales";
  headerCta?: string;
}) {
  return (
    <div data-theme={theme} className="flex min-h-svh flex-1 flex-col bg-background">
      {promo ? <PromoBanner /> : null}
      <PublicHeader overlay={theme === "sales"} ctaLabel={headerCta} />
      {children}
      <PublicFooter />
    </div>
  );
}
