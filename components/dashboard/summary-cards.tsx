import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DisabledAction } from "@/components/dashboard/disabled-action";
import { creditsAvailableLabel } from "@/lib/dashboard/copy";
import type { DashboardSummary } from "@/lib/dashboard/summary";

export function SummaryCards({
  summary,
  buyReason,
}: {
  summary: DashboardSummary;
  buyReason: string | null;
}) {
  return (
    <ul className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <li className="rounded-lg border border-border bg-surface p-5">
        <p className="text-sm text-muted">Ad Credits</p>
        <p className="mt-3 font-display text-3xl text-foreground">
          {creditsAvailableLabel(summary.credits)}
        </p>
        <div className="mt-6">
          {buyReason ? (
            <DisabledAction label="Buy Credits" reason={buyReason} />
          ) : (
            <Button asChild variant="outline">
              <Link href="/dashboard/billing">Buy Credits</Link>
            </Button>
          )}
        </div>
      </li>
      <li className="rounded-lg border border-border bg-surface p-5">
        <p className="text-sm text-muted">Commercials</p>
        <p className="mt-3 font-display text-3xl text-foreground">{summary.commercialsCompleted}</p>
        <p className="mt-2 text-sm text-muted">Completed</p>
      </li>
      <li className="rounded-lg border border-border bg-surface p-5">
        <p className="text-sm text-muted">In Production</p>
        <p className="mt-3 font-display text-3xl text-foreground">{summary.inProduction}</p>
        <p className="mt-2 text-sm text-muted">Current active jobs</p>
      </li>
      <li className="rounded-lg border border-border bg-surface p-5">
        <p className="text-sm text-muted">Ready</p>
        <p className="mt-3 font-display text-3xl text-foreground">{summary.ready}</p>
        <p className="mt-2 text-sm text-muted">Recently completed</p>
      </li>
    </ul>
  );
}
