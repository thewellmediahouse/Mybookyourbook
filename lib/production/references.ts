import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { getAuthBaseUrl } from "@/lib/auth/env";
import { assets, identityAssets, presenterIdentities, projects } from "@/lib/db/schema";
import { normalizeIdentityVideoMime } from "@/lib/identity/mime";
import { PHOTO_SLOTS } from "@/lib/identity/slots";
import { listProjectReferenceSlots } from "@/lib/projects/references";
import { CONTEXT_SLOTS } from "@/lib/projects/brief";
import type { VideoSubmitInput } from "@/lib/providers/video/seedance";
import { readR2S3Config } from "@/lib/r2/env";
import { canUseProviderHrefs, providerObjectHref } from "@/lib/r2/provider-href";
import { signR2Request } from "@/lib/r2/sign";

const PROVIDER_GET_EXPIRES_SECONDS = 60 * 60;

export function createProductionUrlSigner(env: Record<string, unknown>) {
  const s3 = readR2S3Config(env);
  if (s3) {
    return async (objectKey: string) => {
      const signed = await signR2Request(s3, {
        method: "GET",
        objectKey,
        expiresIn: PROVIDER_GET_EXPIRES_SECONDS,
      });
      return signed.url;
    };
  }
  const secret =
    typeof env.INTERNAL_SERVICE_SECRET === "string" ? env.INTERNAL_SERVICE_SECRET.trim() : "";
  const appUrl = getAuthBaseUrl(env as { BETTER_AUTH_URL?: string; NEXT_PUBLIC_APP_URL?: string });
  if (!canUseProviderHrefs(appUrl, secret)) {
    return undefined;
  }
  return async (objectKey: string) => providerObjectHref({ appUrl, secret, objectKey });
}

export async function buildVideoSubmitInput(
  db: Db,
  input: {
    projectId: string;
    workspaceId: string;
    userId: string;
    prompt: string;
    signGetUrl?: (objectKey: string) => Promise<string>;
    requireReferenceUrls?: boolean;
  },
): Promise<VideoSubmitInput> {
  const [project] = await db
    .select({ aspectRatio: projects.aspectRatio })
    .from(projects)
    .where(eq(projects.id, input.projectId))
    .limit(1);
  const aspectRatio = project?.aspectRatio?.trim() || "";
  if (!aspectRatio) {
    throw new Error("ASPECT_MISSING");
  }

  const imageUrls: string[] = [];
  const videoUrls: string[] = [];
  if (input.signGetUrl) {
    const [identity] = await db
      .select({ id: presenterIdentities.id })
      .from(presenterIdentities)
      .where(
        and(eq(presenterIdentities.workspaceId, input.workspaceId), eq(presenterIdentities.userId, input.userId)),
      )
      .limit(1);
    if (!identity) {
      throw new Error("IDENTITY_MISSING");
    }
    const identityRows = await db
      .select({
        role: identityAssets.role,
        objectKey: assets.r2ObjectKey,
        mimeType: assets.mimeType,
      })
      .from(identityAssets)
      .innerJoin(assets, eq(identityAssets.assetId, assets.id))
      .where(and(eq(identityAssets.identityId, identity.id), isNull(assets.deletedAt)));
    const byRole = new Map(identityRows.map((row) => [row.role, row]));
    for (const slot of PHOTO_SLOTS) {
      const row = byRole.get(slot);
      if (!row?.objectKey) {
        throw new Error("IDENTITY_INCOMPLETE");
      }
      imageUrls.push(await input.signGetUrl(row.objectKey));
    }
    const video = byRole.get("IDENTITY_VIDEO");
    if (!video?.objectKey) {
      throw new Error("IDENTITY_INCOMPLETE");
    }
    const videoMime = normalizeIdentityVideoMime(video.mimeType ?? "");
    if (videoMime !== "video/mp4" && videoMime !== "video/quicktime" && videoMime !== "video/x-m4v") {
      throw new Error("REFERENCE_VIDEO_FORMAT");
    }
    videoUrls.push(await input.signGetUrl(video.objectKey));

    const context = await listProjectReferenceSlots(db, input.projectId);
    const bySlot = new Map(context.map((row) => [row.mappingSlot, row.r2ObjectKey]));
    for (const slot of CONTEXT_SLOTS) {
      const key = bySlot.get(slot);
      if (key) {
        imageUrls.push(await input.signGetUrl(key));
      }
    }
  } else if (input.requireReferenceUrls) {
    throw new Error("REFERENCES_UNSIGNED");
  }

  return {
    prompt: input.prompt,
    aspectRatio,
    durationSeconds: 30,
    imageUrls,
    videoUrls,
  };
}
