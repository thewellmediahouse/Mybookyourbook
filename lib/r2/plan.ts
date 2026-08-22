import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getMediaBucket } from "./bucket";
import { readR2S3Config, type R2S3Config } from "./env";
import { GET_EXPIRES_SECONDS, PUT_EXPIRES_SECONDS, signR2Request, type SignedObjectRequest } from "./sign";

export type UploadPlan =
  | { mode: "s3"; put: SignedObjectRequest }
  | { mode: "binding"; putUrl: string; headers: Record<string, string> };

export async function getR2Runtime(): Promise<{ bucket: R2Bucket; s3: R2S3Config | null }> {
  const { env } = await getCloudflareContext({ async: true });
  return {
    bucket: await getMediaBucket(),
    s3: readR2S3Config(env as unknown as Record<string, unknown>),
  };
}

export async function planObjectUpload(input: {
  objectKey: string;
  mimeType: string;
  bindingPutUrl: string;
}): Promise<UploadPlan> {
  const { s3 } = await getR2Runtime();
  if (s3) {
    return {
      mode: "s3",
      put: await signR2Request(s3, {
        method: "PUT",
        objectKey: input.objectKey,
        contentType: input.mimeType,
        expiresIn: PUT_EXPIRES_SECONDS,
      }),
    };
  }
  return {
    mode: "binding",
    putUrl: input.bindingPutUrl,
    headers: { "Content-Type": input.mimeType },
  };
}

export const planLogoUpload = planObjectUpload;

export { GET_EXPIRES_SECONDS, PUT_EXPIRES_SECONDS };
