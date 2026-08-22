import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/dashboard/page-intro";
import { ProductionRefresh } from "@/components/production/refresh";
import { ProductionTimeline } from "@/components/production/timeline";
import { Button } from "@/components/ui/button";
import { requireProjectAccess } from "@/lib/authz";
import { DOWNLOAD_1080P, LEAVE_PAGE } from "@/lib/production/copy";
import { timelineState } from "@/lib/production/copy";
import { getLatestJob } from "@/lib/production/queries";
import { customerProductionLabel } from "@/lib/production/status";
import { getDb } from "@/lib/db/client";

export const metadata: Metadata = { title: "Production" };

export default async function ProductionStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireProjectAccess(id);
  const db = await getDb();
  const job = await getLatestJob(db, access.project.id);
  const status = job?.status ?? access.project.status;
  const label = customerProductionLabel(status);
  const done = status === "COMPLETE" || status === "FAILED" || status === "CANCELLED";

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
      <ProductionRefresh active={!done} />
      <PageIntro kicker="PRODUCTION" title={access.project.title} description={label} />
      <p className="mt-6 max-w-2xl text-muted">{LEAVE_PAGE}</p>
      <ProductionTimeline state={timelineState(job?.status ?? null)} />
      {status === "COMPLETE" ? (
        <div className="mt-10 flex flex-wrap gap-3">
          {job?.finalAssetId ? (
            <Button asChild>
              <a href={`/api/assets/${job.finalAssetId}?download=1`}>{DOWNLOAD_1080P}</a>
            </Button>
          ) : null}
          <Button asChild variant={job?.finalAssetId ? "outline" : "default"}>
            <Link href={`/dashboard/commercials/${access.project.id}`}>View my commercial</Link>
          </Button>
        </div>
      ) : null}
      {status === "FAILED" ? (
        <p className="mt-10 max-w-2xl text-muted">
          {job?.customerFailureMessage ?? "We couldn't complete this commercial."}
        </p>
      ) : null}
    </main>
  );
}
