"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MediaPreview } from "@/components/media/preview";
import { uploadSignedFile } from "@/components/media/upload";
import { Spinner } from "@/components/ui/spinner";
import { libraryAcceptAttribute, LIBRARY_MAX_BYTES } from "@/lib/media/mime";

export function ExtraRefsUploader({
  canWrite,
  writeReason,
  items,
}: {
  canWrite: boolean;
  writeReason: string | null;
  items: { id: string; mimeType: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  async function onFile(file: File | undefined) {
    setError(null);
    if (!file) {
      return;
    }
    if (file.size > LIBRARY_MAX_BYTES) {
      setError("That photo is too large. Keep it under 8 MB.");
      return;
    }
    setPending(true);
    setProgress(0);
    try {
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
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed. You can retry.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl text-foreground">Extra photos</h2>
      <p className="mt-3 text-muted">
        Optional. Photos of your shop, product, or place. We keep these on your Reference Profile
        and reuse them. Your selfie video is uploaded above.
      </p>
      {!canWrite ? (
        <p className="mt-4 text-sm text-muted">{writeReason}</p>
      ) : (
        <label className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border px-4 text-sm text-foreground">
          {pending ? <Spinner className="size-4" /> : null}
          {pending ? "Uploading…" : "Upload photo"}
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
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border border-border bg-surface p-3">
              <MediaPreview
                src={`/api/media/assets/${item.id}/play`}
                alt=""
                className="max-h-32 w-full rounded-md bg-surface-secondary object-contain"
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted">No extra photos yet. You can add them later.</p>
      )}
    </section>
  );
}
