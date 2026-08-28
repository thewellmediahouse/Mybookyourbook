import Link from "next/link";
import type { PricingRegion } from "@/lib/plans/queries";
import { cn } from "@/lib/utils";

export function RegionToggle({ region }: { region: PricingRegion }) {
  return (
    <div className="inline-flex rounded-full border border-[#111A31]/12 bg-white p-1" role="group" aria-label="Pricing region">
      <Link
        href="/pricing?region=ZA"
        className={cn(
          "inline-flex min-h-11 items-center rounded-full px-4 text-sm",
          region === "ZA" ? "bg-[#2787FF] font-medium text-[#001038]" : "text-[#5A6480] hover:text-[#111A31]",
        )}
      >
        South Africa
      </Link>
      <Link
        href="/pricing?region=INT"
        className={cn(
          "inline-flex min-h-11 items-center rounded-full px-4 text-sm",
          region === "INT" ? "bg-[#2787FF] font-medium text-[#001038]" : "text-[#5A6480] hover:text-[#111A31]",
        )}
      >
        International
      </Link>
    </div>
  );
}
