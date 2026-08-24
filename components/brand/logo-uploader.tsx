"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MediaPreview, privateAssetSrc } from "@/components/media/preview";
import { putWithProgress, type UploadPlan } from "@/components/media/upload";
import { Button } from "@/components/ui/button";
import { LOGO_MAX_BYTES, logoAcceptAttribute } from "@/lib/r2/mime";

export function LogoUploader({
  businessId,
  logoAssetId,
  canEdit,
}: {
  businessId: string;
  logoAssetId: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    setError(null);
    setMessage(null);
    if (!file) {
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      setError("That logo is too large. Keep it under 5 MB.");
      return;
    }
    setPreview(URL.createObjectURL(file));
    setPending(true);
    setProgress(0);
    try {
      const signed = await fetch(`/api/brands/${businessId}/logo/uploads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mimeType: file.type, sizeBytes: file.size }),
      });
      const signedBody = (await signed.json()) as {
        error?: string;
        objectKey?: string;
        mimeType?: string;
        sizeBytes?: number;
        upload?: UploadPlan;
      };
      if (!signed.ok || !signedBody.objectKey || !signedBody.upload || !signedBody.mimeType) {
        throw new Error(signedBody.error ?? "We couldn't start that upload.");
      }
      const target =
        signedBody.upload.mode === "s3"
          ? { url: signedBody.upload.put.url, headers: signedBody.upload.put.headers }
          : { url: signedBody.upload.putUrl, headers: signedBody.upload.headers };
      await putWithProgress(target.url, file, target.headers, setProgress);
      const complete = await fetch(`/api/brands/${businessId}/logo/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectKey: signedBody.objectKey,
          mimeType: signedBody.mimeType,
          sizeBytes: file.size,
        }),
      });
      const completeBody = (await complete.json()) as { error?: string; assetId?: string };
      if (!complete.ok) {
        throw new Error(completeBody.error ?? "We couldn't finish that upload.");
      }
      if (completeBody.assetId) {
        setPreview(privateAssetSrc(completeBody.assetId));
      }
      setMessage("Logo saved.");
      setProgress(100);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed. You can retry.");
    } finally {
      setPending(false);
    }
  }

  async function onRemove() {
    setError(null);
    setMessage(null);
    setPending(true);
    try {
      const response = await fetch(`/api/brands/${businessId}/logo`, { method: "DELETE" });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "We couldn't remove that logo.");
      }
      setPreview(null);
      setMessage("Logo removed.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't remove that logo.");
    } finally {
      setPending(false);
    }
  }

  const shown = preview ?? (logoAssetId ? privateAssetSrc(logoAssetId) : null);

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="text-sm text-muted">Logo</p>
      {shown ? (
        <MediaPreview src={shown} alt="Brand logo" className="mt-4 max-h-32 max-w-full bg-surface-secondary p-2" />
      ) : (
        <p className="mt-4 text-sm text-muted">No logo uploaded yet.</p>
      )}
      {canEdit ? (
        <div className="mt-4 flex flex-col gap-3">
          <input
            type="file"
            accept={logoAcceptAttribute()}
            disabled={pending}
            className="text-sm text-muted file:mr-3 file:min-h-11 file:rounded-md file:border file:border-border file:bg-transparent file:px-4 file:text-foreground"
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
          {progress !== null && pending ? (
            <p className="text-sm text-muted">Uploading {progress}%</p>
          ) : null}
          {logoAssetId || preview ? (
            <Button type="button" variant="outline" disabled={pending} onClick={() => void onRemove()}>
              Remove logo
            </Button>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">Only studio owners and admins can change the logo.</p>
      )}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-success">{message}</p> : null}
    </div>
  );
}

