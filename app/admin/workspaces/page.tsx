import { PageIntro } from "@/components/dashboard/page-intro";
import { AdminTable } from "@/components/admin/admin-table";
import { getDb } from "@/lib/db/client";
import { listAdminWorkspaces } from "@/lib/admin/queries";

export default async function AdminWorkspacesPage() {
  const rows = await listAdminWorkspaces(await getDb());
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
      <PageIntro kicker="STAFF" title="Workspaces" />
      <AdminTable headers={["Studio", "Type", "Status", "Plan", "Credits", "Owner"]} empty={rows.length === 0}>
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-border last:border-0">
            <td className="px-4 py-3 text-foreground">{row.name}</td>
            <td className="px-4 py-3 text-muted">{row.type}</td>
            <td className="px-4 py-3 text-muted">{row.status}</td>
            <td className="px-4 py-3 text-muted">{row.planCode ?? "None"}</td>
            <td className="px-4 py-3 text-muted">{row.credits ?? 0}</td>
            <td className="px-4 py-3 text-muted">{row.ownerEmail}</td>
          </tr>
        ))}
      </AdminTable>
    </main>
  );
}
