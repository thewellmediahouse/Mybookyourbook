import { AwsClient } from "aws4fetch";
import type { R2S3Config } from "./env";

export const PUT_EXPIRES_SECONDS = 15 * 60;
export const GET_EXPIRES_SECONDS = 30 * 60;

export type SignedObjectRequest = {
  method: "PUT" | "GET";
  url: string;
  headers: Record<string, string>;
  expiresIn: number;
};

function objectUrl(config: R2S3Config, objectKey: string): URL {
  const encodedKey = objectKey
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return new URL(`https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${encodedKey}`);
}

export async function signR2Request(
  config: R2S3Config,
  input: { method: "PUT" | "GET"; objectKey: string; contentType?: string; expiresIn: number },
): Promise<SignedObjectRequest> {
  const client = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: "auto",
    service: "s3",
  });
  const url = objectUrl(config, input.objectKey);
  url.searchParams.set("X-Amz-Expires", String(input.expiresIn));
  const headers = new Headers();
  if (input.method === "PUT" && input.contentType) {
    headers.set("Content-Type", input.contentType);
  }
  const signed = await client.sign(new Request(url, { method: input.method, headers }), {
    aws: { signQuery: true },
  });
  const responseHeaders: Record<string, string> = {};
  if (input.method === "PUT" && input.contentType) {
    responseHeaders["Content-Type"] = input.contentType;
  }
  return {
    method: input.method,
    url: signed.url,
    headers: responseHeaders,
    expiresIn: input.expiresIn,
  };
}
