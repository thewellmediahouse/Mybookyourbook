import { notFound } from "next/navigation";
import { PageIntro } from "@/components/dashboard/page-intro";
import { JobAdminActions } from "@/components/admin/job-actions";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db/client";
import { adminSignedDownload, getAdminJobDetail } from "@/lib/admin/jobs";

export default async function AdminJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAdminJobDetail(await getDb(), id);
  if (!detail) {
    notFound();
  }
  const { env } = await getCloudflareContext({ async: true });
  const source = detail.assets.find((row) => row.category === "source" || row.role === "source");
  const final = detail.assets.find((row) => row.category === "final" || row.role === "master");
  const sourceSigned = source ? await adminSignedDownload(env as unknown as Record<string, unknown>, source.r2ObjectKey) : null;
  const finalSigned = final ? await adminSignedDownload(env as unknown as Record<string, unknown>, final.r2ObjectKey) : null;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
      <PageIntro kicker="STAFF" title={`Job ${detail.job.id.slice(0, 8)}`} description={detail.job.status} />
      <dl className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
        <Item label="Customer" value={`${detail.customer?.name ?? "Unknown"} · ${detail.customer?.email ?? ""}`} />
        <Item label="Workspace" value={detail.workspace?.name ?? detail.job.workspaceId} />
        <Item label="Business" value={detail.business?.name ?? "—"} />
        <Item label="Project" value={detail.project?.title ?? detail.job.projectId} />
        <Item label="Creative version" value={detail.job.creativeVersionId} />
        <Item label="Internal prompt" value={detail.creative?.seedancePrompt ?? "—"} />
        <Item label="Seedance request ID" value={detail.job.videoProviderJobId ?? "—"} />
        <Item label="Topaz request ID" value={detail.job.upscaleProviderJobId ?? "—"} />
        <Item label="Workflow ID" value={detail.job.workflowInstanceId ?? "—"} />
        <Item label="Credit transaction" value={detail.job.creditTransactionId ?? "—"} />
        <Item label="Provider error" value={detail.job.internalFailureMessage ?? "—"} />
      </dl>
      <JobAdminActions jobId={detail.job.id} />
      <section className="mt-10">
        <h2 className="font-display text-2xl text-foreground">Downloads</h2>
        <p className="mt-2 text-sm text-muted">Temporary authorized links. They are not stored.</p>
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          {source ? (
            <li>
              <a className="text-foreground underline" href={sourceSigned?.url ?? `/api/admin/assets/${source.id}?download=1`}>
                Download source
              </a>
            </li>
          ) : (
            <li className="text-muted">No source file yet.</li>
          )}
          {final ? (
            <li>
              <a className="text-foreground underline" href={finalSigned?.url ?? `/api/admin/assets/${final.id}?download=1`}>
                Download final
              </a>
            </li>
          ) : (
            <li className="text-muted">No final file yet.</li>
          )}
        </ul>
      </section>
      <section className="mt-10">
        <h2 className="font-display text-2xl text-foreground">Events</h2>
        <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface">
          {detail.events.map((event) => (
            <li key={event.id} className="px-4 py-3 text-sm text-muted">
              {event.type}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <dt className="text-muted">{label}</dt>
      <dd className="mt-2 break-all text-foreground">{value}</dd>
    </div>
  );
}
