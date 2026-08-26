import { PageIntro } from "@/components/dashboard/page-intro";
import { AdminTable } from "@/components/admin/admin-table";
import { MarkCancelForm } from "@/components/admin/mark-cancel-form";
import { formatStudioDate } from "@/lib/dashboard/format";
import { getDb } from "@/lib/db/client";
import { listAdminSubscriptions } from "@/lib/admin/queries";

export default async function AdminSubscriptionsPage() {
  const rows = await listAdminSubscriptions(await getDb());
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
      <PageIntro
        kicker="STAFF"
        title="Subscriptions"
        description="Mark cancel at period end only after you have stopped the plan in Payoneer. Monthly self-serve cancel is not connected yet."
      />
      <AdminTable
        headers={["Status", "Provider", "Workspace", "Period end", "Cancel"]}
        empty={rows.length === 0}
      >
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-border last:border-0">
            <td className="px-4 py-3 text-foreground">{row.status}</td>
            <td className="px-4 py-3 text-muted">{row.provider}</td>
            <td className="px-4 py-3 text-muted">{row.workspaceId.slice(0, 8)}</td>
            <td className="px-4 py-3 text-muted">{formatStudioDate(row.periodEnd)}</td>
            <td className="px-4 py-3">
              {row.cancelAtPeriodEnd ? (
                <p className="text-muted">Cancels at period end</p>
              ) : (
                <MarkCancelForm subscriptionId={row.id} />
              )}
            </td>
          </tr>
        ))}
      </AdminTable>
    </main>
  );
}
