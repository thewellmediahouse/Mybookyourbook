"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { deleteCommercialAction } from "@/app/dashboard/commercials/[id]/actions";
import { Button } from "@/components/ui/button";
import { NO_PRODUCTION_CREDITS } from "@/lib/credits/copy";
import {
  CLOSE_PLAYER,
  DOWNLOAD_COMMERCIAL,
  FILM_AGAIN,
  FILM_AGAIN_HINT,
  PLAY_COMMERCIAL,
  productionProgressLabel,
  productionProgressPercent,
} from "@/lib/production/copy";
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
  canProduce,
  credits,
  produceBlockedReason,
}: {
  items: CommercialListItem[];
  canDelete: boolean;
  canProduce: boolean;
  credits: number;
  produceBlockedReason?: string;
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
          Finish the steps in Create. When filming starts, a loading card appears here. The
          finished commercial then plays in that same card.
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <StudioVideoCard
                item={item}
                canDelete={canDelete}
                canProduce={canProduce}
                credits={credits}
                produceBlockedReason={produceBlockedReason}
              />
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
  canProduce,
  credits,
  produceBlockedReason,
}: {
  item: CommercialListItem;
  canDelete: boolean;
  canProduce: boolean;
  credits: number;
  produceBlockedReason?: string;
}) {
  const router = useRouter();
  const producing = isInProductionStatus(item.status);
  const percent = productionProgressPercent(item.jobStatus);
  const label = productionProgressLabel(item.jobStatus);
  const playSrc = item.finalAssetId ? `/api/assets/${item.finalAssetId}` : null;
  const ready = Boolean(playSrc) && !producing;
  const canFilmAgain = !producing && (item.status === "READY" || item.status === "FAILED");
  const filmAgainBlocked =
    produceBlockedReason ?? (credits < 1 ? NO_PRODUCTION_CREDITS : null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [watching, setWatching] = useState(false);
  const [pending, setPending] = useState<"idle" | "delete" | "film">("idle");
  const [error, setError] = useState<string | null>(null);
  const shape =
    item.aspectRatio === "9:16"
      ? "aspect-[9/16]"
      : item.aspectRatio === "1:1"
        ? "aspect-square"
        : "aspect-video";

  async function remove() {
    setPending("delete");
    setError(null);
    const result = await deleteCommercialAction(item.id);
    setPending("idle");
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function filmAgain() {
    if (!canProduce || filmAgainBlocked) {
      return;
    }
    setPending("film");
    setError(null);
    try {
      const response = await fetch("/api/production/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: item.id }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "We couldn't start filming.");
      }
      setWatching(false);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't start filming.");
    } finally {
      setPending("idle");
    }
  }

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-surface">
      <div className={cn("relative w-full overflow-hidden bg-surface-secondary", shape)}>
        {ready && playSrc ? (
          watching ? (
            <StudioPlayer title={item.title} src={playSrc} onClose={() => setWatching(false)} />
          ) : (
            <StudioPreview title={item.title} src={playSrc} />
          )
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
        {!producing && !watching && (ready || canDelete || (canFilmAgain && canProduce)) ? (
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
                    disabled={pending !== "idle"}
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
                    busy={pending === "delete"}
                    className="border-[#F4F6FB] bg-transparent text-[#F4F6FB] hover:bg-[#001038]"
                    onClick={() => remove()}
                  >
                    {DELETE_PERMANENT_CONFIRM}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {ready ? (
                  <Button type="button" size="sm" onClick={() => setWatching(true)}>
                    {PLAY_COMMERCIAL}
                  </Button>
                ) : null}
                {canFilmAgain && canProduce ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    busy={pending === "film"}
                    disabled={Boolean(filmAgainBlocked)}
                    title={filmAgainBlocked ?? FILM_AGAIN_HINT}
                    className="border-[#F4F6FB] bg-transparent text-[#F4F6FB] hover:bg-[#001038] disabled:opacity-60"
                    onClick={() => filmAgain()}
                  >
                    {FILM_AGAIN}
                  </Button>
                ) : null}
                {ready ? (
                  <Button asChild size="sm" variant={ready ? "outline" : "default"}>
                    <a
                      href={`${playSrc}?download=1`}
                      className="border-[#F4F6FB] bg-transparent text-[#F4F6FB] hover:bg-[#001038]"
                    >
                      {DOWNLOAD_COMMERCIAL}
                    </a>
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
            {canFilmAgain && canProduce && filmAgainBlocked ? (
              <p className="mt-2 text-sm text-[#F4F6FB]">{filmAgainBlocked}</p>
            ) : null}
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

function StudioPlayer({
  title,
  src,
  onClose,
}: {
  title: string;
  src: string;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-[#001038]">
      <video
        className="min-h-0 w-full flex-1 object-contain"
        controls
        autoPlay
        playsInline
        preload="auto"
        controlsList="nodownload"
        aria-label={title}
      >
        <source src={src} type="video/mp4" />
        Your commercial is ready.
      </video>
      <div className="flex justify-end p-3">
        <Button type="button" size="sm" onClick={onClose}>
          {CLOSE_PLAYER}
        </Button>
      </div>
    </div>
  );
}
