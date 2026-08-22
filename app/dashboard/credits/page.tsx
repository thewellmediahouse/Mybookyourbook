import type { Metadata } from "next";
import Link from "next/link";
import { DisabledAction } from "@/components/dashboard/disabled-action";
import { PageIntro } from "@/components/dashboard/page-intro";
import { Button } from "@/components/ui/button";
import { buyCreditsHoldReason } from "@/lib/billing/availability";
import { creditTypeLabel } from "@/lib/credits";
import { creditsAvailableLabel } from "@/lib/dashboard/copy";
import { formatStudioDate } from "@/lib/dashboard/format";
import { requireStudio } from "@/lib/dashboard/studio";
import { getDashboardSummary, listCreditHistory } from "@/lib/dashboard/summary";

export const metadata: Metadata = { title: "Credits" };

export default async function CreditsPage() {
  const studio = await requireStudio();
  const [summary, history] = await Promise.all([
    getDashboardSummary(studio.db, studio.active.workspaceId),
    listCreditHistory(studio.db, studio.active.workspaceId),
  ]);
  const buyReason = await buyCreditsHoldReason(studio.role);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
      <PageIntro
        kicker="CREDITS"
        title="Ad Credits"
        description="One Ad Credit starts one new commercial production. Concept work before production does not use a credit."
      />
      <p className="mt-10 font-display text-4xl text-foreground">
        {creditsAvailableLabel(summary.credits)}
      </p>
      <div className="mt-8">
        {buyReason ? (
          <DisabledAction label="Buy Credits" reason={buyReason} />
        ) : (
          <Button asChild>
            <Link href="/dashboard/billing">Buy Credits</Link>
          </Button>
        )}
      </div>
      <h2 className="mt-12 font-display text-2xl text-foreground">Credit history</h2>
      {history.length === 0 ? (
        <p className="mt-4 rounded-lg border border-border bg-surface p-6 text-muted">
          No credit movements have been recorded for this studio.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface">
          {history.map((row) => (
            <li key={row.id} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:justify-between">
              <p className="text-foreground">
                {row.amount > 0 ? "+" : ""}
                {row.amount} · {row.description ?? creditTypeLabel(row.type)}
              </p>
              <p className="text-sm text-muted">{formatStudioDate(row.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
