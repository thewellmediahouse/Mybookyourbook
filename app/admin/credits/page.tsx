import { PageIntro } from "@/components/dashboard/page-intro";
import { AdminTable } from "@/components/admin/admin-table";
import { CreditAdjustForm } from "@/components/admin/credit-form";
import { formatStudioDate } from "@/lib/dashboard/format";
import { getDb } from "@/lib/db/client";
import { listAdminCredits } from "@/lib/admin/queries";

export default async function AdminCreditsPage() {
  const rows = await listAdminCredits(await getDb());
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
      <PageIntro kicker="STAFF" title="Credits" description="Grant or deduct Ad Credits with an audit reason." />
      <CreditAdjustForm />
      <AdminTable headers={["Type", "Amount", "Workspace", "When"]} empty={rows.length === 0}>
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-border last:border-0">
            <td className="px-4 py-3 text-foreground">{row.type}</td>
            <td className="px-4 py-3 text-muted">{row.amount}</td>
            <td className="px-4 py-3 text-muted">{row.workspaceId.slice(0, 8)}</td>
            <td className="px-4 py-3 text-muted">{formatStudioDate(row.createdAt)}</td>
          </tr>
        ))}
      </AdminTable>
    </main>
  );
}
