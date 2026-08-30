"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  attachLibraryReferenceAction,
  removeReferenceAction,
} from "@/app/dashboard/create/actions";
import { MediaPreview } from "@/components/media/preview";
import { uploadSignedFile } from "@/components/media/upload";
import { Spinner } from "@/components/ui/spinner";
import { CONTEXT_REFERENCE_LIMIT } from "@/lib/projects/brief";
import { libraryAcceptAttribute, libraryFormatError, LIBRARY_MAX_BYTES, normalizeLibraryMime } from "@/lib/media/mime";
import { cn } from "@/lib/utils";

export type ExtraRefSelection = { id: string; assetId: string };

export function ExtraRefsUploader({
  canWrite,
  writeReason,
  items,
  projectId = null,
  selected = [],
  ensureProject,
  onSelected,
}: {
  canWrite: boolean;
  writeReason: string | null;
  items: { id: string; mimeType: string }[];
  projectId?: string | null;
  selected?: ExtraRefSelection[];
  ensureProject?: () => Promise<string | null>;
  onSelected?: (next: ExtraRefSelection[]) => void;
}) {
  const router = useRouter();
  const pickForAdvert = Boolean(ensureProject && onSelected);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const chosen = new Set(selected.map((item) => item.assetId));

  async function withProject() {
    if (projectId) {
      return projectId;
    }
    return ensureProject?.() ?? null;
  }

  async function onFile(file: File | undefined) {
    setError(null);
    if (!file) {
      return;
    }
    if (pickForAdvert && selected.length >= CONTEXT_REFERENCE_LIMIT) {
      setError("You can add up to 6 extra photos for this advert.");
      return;
    }
    if (!normalizeLibraryMime(file.type, "campaign")) {
      setError(libraryFormatError("campaign"));
      return;
    }
    if (file.size > LIBRARY_MAX_BYTES) {
      setError("That photo is too large. Keep it under 8 MB.");
      return;
    }
    setPending(true);
    setProgress(0);
    try {
      if (!pickForAdvert || !onSelected) {
        await uploadSignedFile({
          signUrl: "/api/media/uploads",
          completeUrl: "/api/media/complete",
          file,
          mimeType: file.type,
          extraSign: { role: "campaign" },
          extraComplete: { role: "campaign" },
          onProgress: setProgress,
        });
        router.refresh();
        return;
      }
      const id = await withProject();
      if (!id) {
        setError("Save the advert first, then add photos.");
        return;
      }
      const uploaded = await uploadSignedFile({
        signUrl: `/api/projects/${id}/references/uploads`,
        completeUrl: `/api/projects/${id}/references/complete`,
        file,
        mimeType: file.type,
        onProgress: setProgress,
      });
      if (!uploaded.assetId || !uploaded.referenceId) {
        throw new Error("We couldn't save that photo.");
      }
      onSelected([...selected, { id: uploaded.referenceId, assetId: uploaded.assetId }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed. You can retry.");
    } finally {
      setPending(false);
      setProgress(null);
    }
  }

  async function toggleSaved(assetId: string) {
    if (!onSelected) {
      return;
    }
    setError(null);
    const existing = selected.find((item) => item.assetId === assetId);
    setPending(true);
    try {
      const id = await withProject();
      if (!id) {
        setError("Save the advert first, then add photos.");
        return;
      }
      if (existing) {
        const result = await removeReferenceAction({ projectId: id, referenceId: existing.id });
        if (result.error) {
          setError(result.error);
          return;
        }
        onSelected(selected.filter((item) => item.assetId !== assetId));
        return;
      }
      if (selected.length >= CONTEXT_REFERENCE_LIMIT) {
        setError("You can add up to 6 extra photos for this advert.");
        return;
      }
      const result = await attachLibraryReferenceAction({ projectId: id, assetId });
      if (result.error || !result.referenceId) {
        setError(result.error || "We couldn't add that photo.");
        return;
      }
      onSelected([...selected, { id: result.referenceId, assetId }]);
    } finally {
      setPending(false);
    }
  }

  return (
    <section>
      <h3 className="font-display text-xl text-foreground">
        {pickForAdvert ? "Extra photos for this advert" : "Extra photos"}
      </h3>
      <p className="mt-2 text-muted">
        {pickForAdvert
          ? "Optional. Upload new photos of your shop, product, or place, or pick from photos you already uploaded. Face photos and the selfie video are chosen above."
          : "Optional. Photos of your shop, product, or place. You can pick these when you create an advert."}
      </p>
      {!canWrite ? (
        <p className="mt-4 text-sm text-muted">{writeReason}</p>
      ) : (
        <label className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border px-4 text-sm text-foreground">
          {pending ? <Spinner className="size-4" /> : null}
          {pending ? "Uploading…" : "Upload new photo"}
          <input
            type="file"
            accept={libraryAcceptAttribute("campaign")}
            className="hidden"
            disabled={pending}
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
        </label>
      )}
      {pending && progress !== null ? <p className="mt-2 text-sm text-muted">Uploading {progress}%</p> : null}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      {items.length > 0 ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {items.map((item) => {
            const on = chosen.has(item.id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={pending || !canWrite || !pickForAdvert}
                  onClick={() => void toggleSaved(item.id)}
                  className={cn(
                    "w-full rounded-lg border bg-surface p-3 text-left",
                    on ? "border-accent" : "border-border",
                    !pickForAdvert ? "cursor-default" : undefined,
                  )}
                >
                  <MediaPreview
                    src={`/api/media/assets/${item.id}/play`}
                    mimeType={item.mimeType}
                    alt=""
                    className="max-h-32 w-full rounded-md bg-surface-secondary object-contain"
                  />
                  {pickForAdvert ? (
                    <p className="mt-2 text-sm text-foreground">{on ? "Using this photo" : "Use this photo"}</p>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted">No saved extra photos yet. Upload one for this advert.</p>
      )}
    </section>
  );
}
