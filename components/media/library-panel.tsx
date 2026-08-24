"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { MediaPreview, privateAssetSrc } from "@/components/media/preview";
import { uploadSignedFile } from "@/components/media/upload";
import { Button } from "@/components/ui/button";
import { formatStudioDate } from "@/lib/dashboard/format";
import { BRAND_LOGO_CAPTION, BRAND_LOGO_CHANGE, BRAND_LOGO_HINT } from "@/lib/media/copy";
import { libraryAcceptAttribute, libraryMaxBytes, libraryTooLargeMessage } from "@/lib/media/mime";
import { libraryRoleLabel } from "@/lib/media/slots";
import type { LibraryRole } from "@/lib/r2/keys";

export type LibraryItemView = {
  id: string;
  source: "library" | "brand-logo";
  role: LibraryRole;
  mimeType: string;
  createdAt: string;
};

export function LibraryPanel({
  role,
  empty,
  items,
  canWrite,
  writeReason,
}: {
  role: LibraryRole;
  empty: string;
  items: LibraryItemView[];
  canWrite: boolean;
  writeReason: string | null;
}) {
  return (
    <div className="mt-8">
      <LibraryUploader role={role} canWrite={canWrite} writeReason={writeReason} />
      {items.length === 0 ? (
        <p className="mt-8 rounded-lg border border-border bg-surface p-6 text-muted">{empty}</p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={`${item.source}-${item.id}`}>
              <LibraryCard item={item} canWrite={canWrite} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LibraryUploader({
  role,
  canWrite,
  writeReason,
}: {
  role: LibraryRole;
  canWrite: boolean;
  writeReason: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    setError(null);
    setMessage(null);
    if (!file) {
      return;
    }
    if (file.size > libraryMaxBytes(file.type || "image/jpeg")) {
      setError(libraryTooLargeMessage(file.type || "image/jpeg"));
      return;
    }
    setFilename(file.name);
    setPreview(URL.createObjectURL(file));
    setPending(true);
    setProgress(0);
    try {
      const uploaded = await uploadSignedFile({
        signUrl: "/api/media/uploads",
        completeUrl: "/api/media/complete",
        file,
        mimeType: file.type,
        extraSign: { role },
        extraComplete: { role },
        onProgress: setProgress,
      });
      if (uploaded.assetId) {
        setPreview(privateAssetSrc(uploaded.assetId));
      }
      setMessage("Saved.");
      setProgress(100);
      if (fileRef.current) {
        fileRef.current.value = "";
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed. You can retry.");
    } finally {
      setPending(false);
    }
  }

  if (!canWrite) {
    return (
      <div>
        <Button type="button" disabled>
          Add {libraryRoleLabel(role).toLowerCase()}
        </Button>
        {writeReason ? <p className="mt-2 max-w-md text-sm text-muted">{writeReason}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" busy={pending} onClick={() => fileRef.current?.click()}>
          {pending ? "Uploading…" : `Add ${libraryRoleLabel(role).toLowerCase()}`}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept={libraryAcceptAttribute(role)}
          className="hidden"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
        {filename ? <p className="text-sm text-muted">{filename}</p> : null}
      </div>
      {preview ? (
        // Private library file; cookies must be sent.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="mt-4 max-h-40 max-w-full rounded-md bg-surface-secondary" />
      ) : null}
      {pending && progress !== null ? <p className="mt-3 text-sm text-muted">Uploading {progress}%</p> : null}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-success">{message}</p> : null}
    </div>
  );
}

function LibraryCard({ item, canWrite }: { item: LibraryItemView; canWrite: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const preview = `/api/media/assets/${item.id}/play?v=${encodeURIComponent(item.createdAt)}`;
  const isBrandLogo = item.source === "brand-logo";

  async function onRemove() {
    setError(null);
    if (!window.confirm("Remove this file from the library?")) {
      return;
    }
    setPending(true);
    try {
      const response = await fetch(`/api/media/assets/${item.id}`, { method: "DELETE" });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "We couldn't remove that file.");
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't remove that file.");
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="rounded-lg border border-border bg-surface p-4">
      <MediaPreview
        src={preview}
        mimeType={item.mimeType}
        alt={isBrandLogo ? BRAND_LOGO_CAPTION : libraryRoleLabel(item.role)}
        className="max-h-40 w-full rounded-md bg-surface-secondary object-contain"
      />
      <p className="mt-3 text-foreground">
        {isBrandLogo ? BRAND_LOGO_CAPTION : libraryRoleLabel(item.role)}
      </p>
      <p className="mt-1 text-sm text-muted">{formatStudioDate(new Date(item.createdAt))}</p>
      {isBrandLogo ? (
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href="/dashboard/brand">{BRAND_LOGO_CHANGE}</Link>
          </Button>
          <p className="mt-2 text-sm text-muted">{BRAND_LOGO_HINT}</p>
        </div>
      ) : canWrite ? (
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          disabled={pending}
          onClick={() => void onRemove()}
        >
          Remove
        </Button>
      ) : null}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </article>
  );
}
