import Link from "next/link";
import { PageIntro } from "@/components/dashboard/page-intro";
import { AdminTable } from "@/components/admin/admin-table";
import { formatStudioDate } from "@/lib/dashboard/format";
import { getDb } from "@/lib/db/client";
import { listAdminTickets } from "@/lib/admin/queries";

export default async function AdminSupportPage() {
  const rows = await listAdminTickets(await getDb());
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
      <PageIntro kicker="STAFF" title="Support" />
      <AdminTable
        headers={["Subject", "Customer", "Email", "Studio", "Category", "Status", "Created"]}
        empty={rows.length === 0}
      >
        {rows.map((row) => {
          const customer = row.customerName || row.contactName || "Not signed in";
          const email = row.customerEmail || row.contactEmail || "No email";
          const studio = row.studioName || (row.workspaceId ? row.workspaceId.slice(0, 8) : "None");
          return (
            <tr key={row.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3">
                <Link href={`/admin/support/${row.id}`} className="text-foreground underline">
                  {row.subject}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted">{customer}</td>
              <td className="px-4 py-3 text-muted">{email}</td>
              <td className="px-4 py-3 text-muted">{studio}</td>
              <td className="px-4 py-3 text-muted">{row.category}</td>
              <td className="px-4 py-3 text-muted">{row.status}</td>
              <td className="px-4 py-3 text-muted">{formatStudioDate(row.createdAt)}</td>
            </tr>
          );
        })}
      </AdminTable>
    </main>
  );
}
