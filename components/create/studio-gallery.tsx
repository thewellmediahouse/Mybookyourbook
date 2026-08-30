"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { deleteCommercialAction } from "@/app/dashboard/commercials/[id]/actions";
import { Button } from "@/components/ui/button";
import { productionProgressLabel, productionProgressPercent, DOWNLOAD_COMMERCIAL } from "@/lib/production/copy";
import {
  DELETE,
  DELETE_PERMANENT_CONFIRM,
  DELETE_PERMANENT_WARNING,
  KEEP_VIDEO,
} from "@/lib/projects/delivery";
import { isInProductionStatus, projectStatusLabel } from "@/lib/projects/status";
import type { CommercialListItem } from "@/lib/dashboard/summary";
import { cn } from "@/lib/utils";

export function StudioGallery({
  items,
  canDelete,
}: {
  items: CommercialListItem[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const filming = items.some((item) => isInProductionStatus(item.status));

  useEffect(() => {
    if (!filming) {
      return;
    }
    const timer = window.setInterval(() => {
      router.refresh();
    }, 2500);
    return () => window.clearInterval(timer);
  }, [filming, router]);

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-xl text-foreground">Your videos</h2>
        <p className="text-sm text-muted">
          {items.length === 0 ? "Nothing filmed yet" : `${items.length} saved`}
        </p>
      </div>
      {items.length === 0 ? (
        <p className="mt-8 max-w-md text-muted">
          Finish the steps on the left. When filming starts, a loading card appears here. The
          finished commercial then plays in that same card.
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <StudioVideoCard item={item} canDelete={canDelete} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StudioVideoCard({
  item,
  canDelete,
}: {
  item: CommercialListItem;
  canDelete: boolean;
}) {
  const router = useRouter();
  const producing = isInProductionStatus(item.status);
  const percent = productionProgressPercent(item.jobStatus);
  const label = productionProgressLabel(item.jobStatus);
  const ready = Boolean(item.finalAssetId) && !producing;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shape =
    item.aspectRatio === "9:16"
      ? "aspect-[9/16]"
      : item.aspectRatio === "1:1"
        ? "aspect-square"
        : "aspect-video";

  async function remove() {
    setPending(true);
    setError(null);
    const result = await deleteCommercialAction(item.id);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className={cn("relative w-full overflow-hidden bg-surface-secondary", shape)}>
        {ready ? (
          <video
            className="h-full w-full object-cover"
            controls
            poster={item.thumbnailAssetId ? `/api/assets/${item.thumbnailAssetId}` : undefined}
            src={`/api/assets/${item.finalAssetId}`}
            preload="metadata"
          >
            Your commercial is ready.
          </video>
        ) : producing ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
            <span
              className="size-12 animate-spin rounded-full border-2 border-muted border-t-accent"
              aria-hidden
            />
            <p className="tabular-nums text-2xl font-medium text-foreground">{percent}%</p>
            <p className="text-sm text-muted">{label}</p>
          </div>
        ) : (
          <Link
            href={`/dashboard/create?project=${item.id}`}
            className="flex h-full items-center justify-center px-4 text-center text-sm text-muted"
          >
            {item.thumbnailAssetId ? (
              // Authenticated studio stream; not a public CDN image.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/assets/${item.thumbnailAssetId}`}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              projectStatusLabel(item.status)
            )}
          </Link>
        )}
      </div>
      <div className="p-4">
        <p className="truncate text-foreground">{item.title}</p>
        <p className="mt-1 truncate text-sm text-muted">
          {item.businessName}
          {producing ? ` · ${percent}%` : ""}
        </p>
        {!producing && (ready || canDelete) ? (
          confirmDelete ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted">{DELETE_PERMANENT_WARNING}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    setConfirmDelete(false);
                    setError(null);
                  }}
                >
                  {KEEP_VIDEO}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  busy={pending}
                  onClick={() => void remove()}
                >
                  {DELETE_PERMANENT_CONFIRM}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {ready ? (
                <Button asChild size="sm">
                  <a href={`/api/assets/${item.finalAssetId}?download=1`}>{DOWNLOAD_COMMERCIAL}</a>
                </Button>
              ) : null}
              {canDelete ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                >
                  {DELETE}
                </Button>
              ) : null}
            </div>
          )
        ) : null}
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      </div>
    </article>
  );
}
