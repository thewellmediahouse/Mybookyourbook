import { getCloudflareContext } from "@opennextjs/cloudflare";
import { assertWorkspaceObjectKey } from "./keys";

export async function getMediaBucket(): Promise<R2Bucket> {
  const { env } = await getCloudflareContext({ async: true });
  return env.MEDIA_BUCKET;
}

export async function putWorkspaceObject(
  bucket: R2Bucket,
  input: { workspaceId: string; objectKey: string; body: ArrayBuffer | Uint8Array | Blob; mimeType: string },
) {
  assertWorkspaceObjectKey(input.objectKey, input.workspaceId);
  await bucket.put(input.objectKey, input.body, {
    httpMetadata: { contentType: input.mimeType },
  });
}

export async function getWorkspaceObject(bucket: R2Bucket, workspaceId: string, objectKey: string) {
  assertWorkspaceObjectKey(objectKey, workspaceId);
  return bucket.get(objectKey);
}

export async function headWorkspaceObject(bucket: R2Bucket, workspaceId: string, objectKey: string) {
  assertWorkspaceObjectKey(objectKey, workspaceId);
  return bucket.head(objectKey);
}

export async function deleteWorkspaceObject(bucket: R2Bucket, workspaceId: string, objectKey: string) {
  assertWorkspaceObjectKey(objectKey, workspaceId);
  await bucket.delete(objectKey);
}
