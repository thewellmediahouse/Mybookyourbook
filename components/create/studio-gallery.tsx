"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
    <article className="group overflow-hidden rounded-2xl border border-border bg-surface">
      <div className={cn("relative w-full overflow-hidden bg-surface-secondary", shape)}>
        {ready ? (
          <StudioPreview title={item.title} src={`/api/assets/${item.finalAssetId}`} />
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
        {!producing && (ready || canDelete) ? (
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 flex flex-col bg-[#001038] p-3 transition-opacity",
              confirmDelete
                ? "pointer-events-auto opacity-100"
                : "pointer-events-auto opacity-100 [@media(hover:hover)]:pointer-events-none [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:pointer-events-auto [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:pointer-events-auto [@media(hover:hover)]:group-focus-within:opacity-100",
            )}
          >
            {confirmDelete ? (
              <div className="space-y-3">
                <p className="text-sm text-[#F4F6FB]">{DELETE_PERMANENT_WARNING}</p>
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
                    className="border-[#F4F6FB] bg-transparent text-[#F4F6FB] hover:bg-[#001038]"
                    onClick={() => void remove()}
                  >
                    {DELETE_PERMANENT_CONFIRM}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
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
                    className="border-[#F4F6FB] bg-transparent text-[#F4F6FB] hover:bg-[#001038]"
                    onClick={() => setConfirmDelete(true)}
                  >
                    {DELETE}
                  </Button>
                ) : null}
              </div>
            )}
            {error ? <p className="mt-2 text-sm text-[#F4F6FB]">{error}</p> : null}
          </div>
        ) : null}
      </div>
      <div className="p-4">
        <p className="truncate text-foreground">{item.title}</p>
        <p className="mt-1 truncate text-sm text-muted">
          {item.businessName}
          {producing ? ` · ${percent}%` : ""}
        </p>
      </div>
    </article>
  );
}

function StudioPreview({ title, src }: { title: string; src: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }
    const tryPlay = () => {
      node.muted = true;
      void node.play().catch(() => undefined);
    };
    const onEnded = () => {
      node.currentTime = 0;
      tryPlay();
    };
    tryPlay();
    node.addEventListener("canplay", tryPlay);
    node.addEventListener("loadeddata", tryPlay);
    node.addEventListener("ended", onEnded);
    let root: Element | null = node.parentElement;
    while (root && root !== document.body) {
      const overflowY = window.getComputedStyle(root).overflowY;
      if (overflowY === "auto" || overflowY === "scroll") {
        break;
      }
      root = root.parentElement;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          tryPlay();
        } else {
          node.pause();
        }
      },
      { root: root === document.body ? null : root, threshold: 0.15, rootMargin: "64px" },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      node.removeEventListener("canplay", tryPlay);
      node.removeEventListener("loadeddata", tryPlay);
      node.removeEventListener("ended", onEnded);
    };
  }, [src]);

  return (
    <video
      ref={ref}
      className="absolute inset-0 size-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      aria-label={`${title} preview`}
    >
      <source src={src} type="video/mp4" />
      Your commercial is ready.
    </video>
  );
}
