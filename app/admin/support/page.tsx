import { PageIntro } from "@/components/dashboard/page-intro";
import { AdminTable } from "@/components/admin/admin-table";
import { TicketStatusForm } from "@/components/admin/ticket-form";
import { formatStudioDate } from "@/lib/dashboard/format";
import { getDb } from "@/lib/db/client";
import { listAdminTickets } from "@/lib/admin/queries";

export default async function AdminSupportPage() {
  const rows = await listAdminTickets(await getDb());
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
      <PageIntro kicker="STAFF" title="Support" />
      <AdminTable headers={["Subject", "Category", "Status", "Created", "Update"]} empty={rows.length === 0}>
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-border last:border-0">
            <td className="px-4 py-3 text-foreground">{row.subject}</td>
            <td className="px-4 py-3 text-muted">{row.category}</td>
            <td className="px-4 py-3 text-muted">{row.status}</td>
            <td className="px-4 py-3 text-muted">{formatStudioDate(row.createdAt)}</td>
            <td className="px-4 py-3">
              <TicketStatusForm ticketId={row.id} status={row.status} />
            </td>
          </tr>
        ))}
      </AdminTable>
    </main>
  );
}
