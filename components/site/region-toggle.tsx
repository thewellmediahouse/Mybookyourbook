import Link from "next/link";
import type { PricingRegion } from "@/lib/plans/queries";

export function RegionToggle({ region }: { region: PricingRegion }) {
  return (
    <div className="inline-flex rounded-full border border-border p-1" role="group" aria-label="Pricing region">
      <Link
        href="/pricing?region=ZA"
        className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm ${
          region === "ZA" ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
        }`}
      >
        South Africa
      </Link>
      <Link
        href="/pricing?region=INT"
        className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm ${
          region === "INT" ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
        }`}
      >
        International
      </Link>
    </div>
  );
}
