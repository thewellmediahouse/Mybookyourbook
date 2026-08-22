import Link from "next/link";
import { PageIntro } from "@/components/dashboard/page-intro";
import { AdminTable } from "@/components/admin/admin-table";
import { formatStudioDate } from "@/lib/dashboard/format";
import { getDb } from "@/lib/db/client";
import { listAdminUsers } from "@/lib/admin/queries";

export default async function AdminUsersPage() {
  const users = await listAdminUsers(await getDb());
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
      <PageIntro kicker="STAFF" title="Users" description="Accounts on Production30. Passwords are never shown." />
      <AdminTable headers={["Name", "Email", "Verified", "Created"]} empty={users.length === 0}>
        {users.map((row) => (
          <tr key={row.id} className="border-b border-border last:border-0">
            <td className="px-4 py-3">
              <Link href={`/admin/users/${row.id}`} className="text-foreground underline">
                {row.name}
              </Link>
            </td>
            <td className="px-4 py-3 text-muted">{row.email}</td>
            <td className="px-4 py-3 text-muted">{row.emailVerified ? "Yes" : "No"}</td>
            <td className="px-4 py-3 text-muted">{formatStudioDate(row.createdAt)}</td>
          </tr>
        ))}
      </AdminTable>
    </main>
  );
}
