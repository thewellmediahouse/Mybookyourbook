import { PageIntro } from "@/components/dashboard/page-intro";
import { AdminTable } from "@/components/admin/admin-table";
import { formatStudioDate } from "@/lib/dashboard/format";
import { getDb } from "@/lib/db/client";
import { listAdminAudit } from "@/lib/admin/queries";

export default async function AdminAuditPage() {
  const rows = await listAdminAudit(await getDb());
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
      <PageIntro kicker="STAFF" title="Audit Log" />
      <AdminTable headers={["Action", "Target", "Actor", "When"]} empty={rows.length === 0}>
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-border last:border-0">
            <td className="px-4 py-3 text-foreground">{row.action}</td>
            <td className="px-4 py-3 text-muted">
              {row.targetType ?? "—"} {row.targetId ? row.targetId.slice(0, 8) : ""}
            </td>
            <td className="px-4 py-3 text-muted">{row.actorUserId ? row.actorUserId.slice(0, 8) : "system"}</td>
            <td className="px-4 py-3 text-muted">{formatStudioDate(row.createdAt)}</td>
          </tr>
        ))}
      </AdminTable>
    </main>
  );
}
