export type R2S3Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

export function readR2S3Config(env: Record<string, unknown>): R2S3Config | null {
  const accountId = stringValue(env, "R2_ACCOUNT_ID");
  const accessKeyId = stringValue(env, "R2_ACCESS_KEY_ID");
  const secretAccessKey = stringValue(env, "R2_SECRET_ACCESS_KEY");
  const bucket = stringValue(env, "R2_BUCKET_NAME") ?? "cineyou-production";
  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }
  return { accountId, accessKeyId, secretAccessKey, bucket };
}

function stringValue(env: Record<string, unknown>, key: string): string | null {
  const value = env[key];
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
