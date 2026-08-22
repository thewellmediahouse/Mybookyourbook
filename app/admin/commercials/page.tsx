import { PageIntro } from "@/components/dashboard/page-intro";
import { AdminTable } from "@/components/admin/admin-table";
import { formatStudioDate } from "@/lib/dashboard/format";
import { getDb } from "@/lib/db/client";
import { listAdminCommercials } from "@/lib/admin/queries";

export default async function AdminCommercialsPage() {
  const rows = await listAdminCommercials(await getDb());
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
      <PageIntro kicker="STAFF" title="Commercials" />
      <AdminTable headers={["Title", "Status", "Workspace", "Created"]} empty={rows.length === 0}>
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-border last:border-0">
            <td className="px-4 py-3 text-foreground">{row.title}</td>
            <td className="px-4 py-3 text-muted">{row.status}</td>
            <td className="px-4 py-3 text-muted">{row.workspaceId.slice(0, 8)}</td>
            <td className="px-4 py-3 text-muted">{formatStudioDate(row.createdAt)}</td>
          </tr>
        ))}
      </AdminTable>
    </main>
  );
}
