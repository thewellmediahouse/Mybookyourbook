import { PageIntro } from "@/components/dashboard/page-intro";
import { formatMoney } from "@/lib/plans/format";
import { getDb } from "@/lib/db/client";
import { getAdminOverview } from "@/lib/admin/queries";

export default async function AdminHomePage() {
  const overview = await getAdminOverview(await getDb());
  const cards = [
    { label: "Users", value: String(overview.users) },
    { label: "Paying Workspaces", value: String(overview.payingWorkspaces) },
    { label: "Commercials Produced", value: String(overview.commercialsProduced) },
    { label: "Active Jobs", value: String(overview.activeJobs) },
    { label: "Failed Jobs", value: String(overview.failedJobs) },
    { label: "Revenue (ZAR)", value: formatMoney(overview.revenueZarMinor, "ZAR") },
    { label: "Revenue (USD)", value: formatMoney(overview.revenueUsdMinor, "USD") },
    { label: "Credits Sold", value: String(overview.creditsSold) },
    { label: "Estimated AI Cost", value: `USD ${overview.estimatedAiCostUsd}` },
    { label: "Estimated Gross Margin", value: `USD ${overview.estimatedGrossMarginUsd}` },
    { label: "Approx R2 Storage", value: `${overview.approxStorageBytes} bytes` },
    { label: "Open Tickets", value: String(overview.openTickets) },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
      <PageIntro
        kicker="STAFF"
        title="Overview"
        description="Live counts from this database. Empty values are zero, not estimates."
      />
      <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <li key={card.label} className="rounded-lg border border-border bg-surface p-5">
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-2 font-display text-2xl text-foreground">{card.value}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
