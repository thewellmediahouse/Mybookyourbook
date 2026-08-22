import { notFound } from "next/navigation";
import Link from "next/link";
import { PageIntro } from "@/components/dashboard/page-intro";
import { getDb } from "@/lib/db/client";
import { getAdminUser } from "@/lib/admin/queries";
import { UserAdminActions } from "@/components/admin/user-actions";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const detail = await getAdminUser(await getDb(), userId);
  if (!detail) {
    notFound();
  }
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
      <PageIntro kicker="STAFF" title={detail.user.name} description={detail.user.email} />
      <UserAdminActions userId={detail.user.id} email={detail.user.email} memberships={detail.memberships} />
      <section className="mt-10">
        <h2 className="font-display text-2xl text-foreground">Studios</h2>
        <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface">
          {detail.memberships.map((row) => (
            <li key={row.workspaceId} className="px-4 py-3 text-sm text-muted">
              {row.workspaceName} · {row.role} · {row.memberStatus} · {row.credits ?? 0} credits
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-10">
        <h2 className="font-display text-2xl text-foreground">Commercials</h2>
        <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface">
          {detail.projects.length === 0 ? <li className="px-4 py-3 text-muted">None.</li> : null}
          {detail.projects.map((row) => (
            <li key={row.id} className="px-4 py-3 text-sm text-muted">
              {row.title} · {row.status}
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-10">
        <h2 className="font-display text-2xl text-foreground">Jobs</h2>
        <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface">
          {detail.jobs.length === 0 ? <li className="px-4 py-3 text-muted">None.</li> : null}
          {detail.jobs.map((row) => (
            <li key={row.id} className="px-4 py-3 text-sm">
              <Link href={`/admin/jobs/${row.id}`} className="text-foreground underline">
                {row.id.slice(0, 8)}
              </Link>
              <span className="text-muted"> · {row.status}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
