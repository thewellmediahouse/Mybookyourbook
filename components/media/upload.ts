export type UploadPlan =
  | { mode: "s3"; put: { url: string; headers: Record<string, string> } }
  | { mode: "binding"; putUrl: string; headers: Record<string, string> };

export function putWithProgress(
  url: string,
  file: Blob,
  headers: Record<string, string>,
  onProgress: (value: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.withCredentials = true;
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error("Upload failed. You can retry."));
    };
    xhr.onerror = () => reject(new Error("Upload failed. You can retry."));
    xhr.send(file);
  });
}

export async function uploadSignedFile(input: {
  signUrl: string;
  completeUrl: string;
  file: Blob;
  mimeType: string;
  extraSign?: Record<string, unknown>;
  extraComplete?: Record<string, unknown>;
  onProgress: (value: number) => void;
}) {
  const signed = await fetch(input.signUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mimeType: input.mimeType,
      sizeBytes: input.file.size,
      ...input.extraSign,
    }),
  });
  const signedBody = (await signed.json()) as {
    error?: string;
    objectKey?: string;
    mimeType?: string;
    upload?: UploadPlan;
  };
  if (!signed.ok || !signedBody.objectKey || !signedBody.upload || !signedBody.mimeType) {
    throw new Error(signedBody.error ?? "We couldn't start that upload.");
  }
  const target =
    signedBody.upload.mode === "s3"
      ? { url: signedBody.upload.put.url, headers: signedBody.upload.put.headers }
      : { url: signedBody.upload.putUrl, headers: signedBody.upload.headers };
  await putWithProgress(target.url, input.file, target.headers, input.onProgress);
  const complete = await fetch(input.completeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      objectKey: signedBody.objectKey,
      mimeType: signedBody.mimeType,
      sizeBytes: input.file.size,
      ...input.extraComplete,
    }),
  });
  const completeBody = (await complete.json()) as { error?: string; assetId?: string };
  if (!complete.ok) {
    throw new Error(completeBody.error ?? "We couldn't finish that upload.");
  }
  return { assetId: typeof completeBody.assetId === "string" ? completeBody.assetId : null };
}
