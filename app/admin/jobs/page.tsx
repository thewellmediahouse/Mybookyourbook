import Link from "next/link";
import { PageIntro } from "@/components/dashboard/page-intro";
import { AdminTable } from "@/components/admin/admin-table";
import { formatStudioDate } from "@/lib/dashboard/format";
import { getDb } from "@/lib/db/client";
import { listAdminJobs } from "@/lib/admin/queries";

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const status = (await searchParams).status;
  const rows = await listAdminJobs(await getDb(), status);
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
      <PageIntro
        kicker="STAFF"
        title={status === "FAILED" ? "Failed Jobs" : "Production Jobs"}
        description="Open a job to retry a stage, refund once, mark a technical failure, or cancel."
      />
      <AdminTable headers={["Job", "Status", "Failure", "Created"]} empty={rows.length === 0}>
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-border last:border-0">
            <td className="px-4 py-3">
              <Link href={`/admin/jobs/${row.id}`} className="text-foreground underline">
                {row.id.slice(0, 8)}
              </Link>
            </td>
            <td className="px-4 py-3 text-muted">{row.status}</td>
            <td className="px-4 py-3 text-muted">{row.failureType ?? "—"}</td>
            <td className="px-4 py-3 text-muted">{formatStudioDate(row.createdAt)}</td>
          </tr>
        ))}
      </AdminTable>
    </main>
  );
}
