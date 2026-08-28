import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DisabledAction } from "@/components/dashboard/disabled-action";
import { creditsAvailableLabel } from "@/lib/dashboard/copy";
import type { DashboardSummary } from "@/lib/dashboard/summary";

const cards = [
  { key: "credits", label: "Ad Credits", hint: "Available to produce" },
  { key: "commercials", label: "Commercials", hint: "Completed" },
  { key: "production", label: "In Production", hint: "Current active jobs" },
  { key: "ready", label: "Ready", hint: "Recently completed" },
] as const;

export function SummaryCards({
  summary,
  buyReason,
}: {
  summary: DashboardSummary;
  buyReason: string | null;
}) {
  const values = {
    credits: creditsAvailableLabel(summary.credits),
    commercials: String(summary.commercialsCompleted),
    production: String(summary.inProduction),
    ready: String(summary.ready),
  };

  return (
    <ul className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <li key={card.key} className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">{card.label}</p>
          <p className="mt-3 font-display text-3xl text-foreground">{values[card.key]}</p>
          {card.key === "credits" ? (
            <div className="mt-6">
              {buyReason ? (
                <DisabledAction label="Buy Credits" reason={buyReason} />
              ) : (
                <Button asChild variant="outline">
                  <Link href="/dashboard/billing">Buy Credits</Link>
                </Button>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">{card.hint}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
