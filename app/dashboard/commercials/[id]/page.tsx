import type { Metadata } from "next";
import Link from "next/link";
import { CommercialActions } from "@/components/dashboard/commercial-actions";
import { PageIntro } from "@/components/dashboard/page-intro";
import { Button } from "@/components/ui/button";
import { canProduce, requireProjectAccess } from "@/lib/authz";
import {
  formatCampaignCta,
  formatCommercialFormat,
  formatDurationSeconds,
  formatStudioDate,
} from "@/lib/dashboard/format";
import { getProjectThumbnailAssetId } from "@/lib/dashboard/summary";
import { getDb } from "@/lib/db/client";
import { businesses } from "@/lib/db/schema";
import { DOWNLOAD_COMMERCIAL } from "@/lib/production/copy";
import { getPlayableFinalJob } from "@/lib/production/queries";
import { isCreateWizardStatus, isInProductionStatus, projectStatusLabel } from "@/lib/projects/status";
import { eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Commercial" };

export default async function CommercialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireProjectAccess(id);
  const db = await getDb();
  const [brand] = await db
    .select({ name: businesses.name })
    .from(businesses)
    .where(eq(businesses.id, access.project.businessId))
    .limit(1);
  const job = await getPlayableFinalJob(db, access.project.id);
  const thumbnailAssetId = await getProjectThumbnailAssetId(db, access.project.id);
  const finalAssetId = job?.finalAssetId ?? null;
  const dated = job?.completedAt ?? access.project.updatedAt;
  const playerClass =
    access.project.aspectRatio === "9:16"
      ? "mt-10 w-full max-w-md rounded-lg border border-border bg-black aspect-[9/16]"
      : access.project.aspectRatio === "1:1"
        ? "mt-10 w-full max-w-xl rounded-lg border border-border bg-black aspect-square"
        : "mt-10 w-full max-w-5xl rounded-lg border border-border bg-black aspect-video";

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
      <PageIntro
        kicker="COMMERCIAL"
        title={access.project.title}
        description={`${brand?.name ?? "Brand"} · ${projectStatusLabel(access.project.status)}`}
      />
      <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-5">
          <dt className="text-sm text-muted">Brand</dt>
          <dd className="mt-2 text-foreground">{brand?.name ?? "Brand"}</dd>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <dt className="text-sm text-muted">Date</dt>
          <dd className="mt-2 text-foreground">{formatStudioDate(dated)}</dd>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <dt className="text-sm text-muted">Format</dt>
          <dd className="mt-2 text-foreground">{formatCommercialFormat(access.project)}</dd>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <dt className="text-sm text-muted">Duration</dt>
          <dd className="mt-2 text-foreground">{formatDurationSeconds(access.project.duration)}</dd>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <dt className="text-sm text-muted">Objective</dt>
          <dd className="mt-2 text-foreground">{access.project.objective?.trim() || "Not set"}</dd>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <dt className="text-sm text-muted">Call to action</dt>
          <dd className="mt-2 text-foreground">
            {formatCampaignCta(access.project.ctaType, access.project.ctaValue)}
          </dd>
        </div>
      </dl>
      {finalAssetId ? (
        <video
          className={playerClass}
          controls
          poster={thumbnailAssetId ? `/api/assets/${thumbnailAssetId}` : undefined}
          src={`/api/assets/${finalAssetId}`}
        >
          Your commercial is ready.
        </video>
      ) : (
        <p className="mt-8 max-w-2xl text-muted">
          Playback and download open after a finished file exists for this commercial. Nothing is
          shown here until then.
        </p>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        {finalAssetId ? (
          <Button asChild>
            <a href={`/api/assets/${finalAssetId}?download=1`}>{DOWNLOAD_COMMERCIAL}</a>
          </Button>
        ) : null}
        {isCreateWizardStatus(access.project.status) ? (
          <Button asChild variant={finalAssetId ? "outline" : "default"}>
            <Link href={`/dashboard/create?project=${access.project.id}`}>
              {access.project.status === "DRAFT" ? "Continue brief" : "Review concept"}
            </Link>
          </Button>
        ) : null}
        {isInProductionStatus(access.project.status) ? (
          <Button asChild>
            <Link href="/dashboard/create">View in studio</Link>
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <Link href="/dashboard/create">Back to studio</Link>
        </Button>
      </div>
      <CommercialActions
        projectId={access.project.id}
        title={access.project.title}
        aspectRatio={access.project.aspectRatio}
        status={access.project.status}
        canManage={canProduce(access.member.role)}
      />
    </main>
  );
}
