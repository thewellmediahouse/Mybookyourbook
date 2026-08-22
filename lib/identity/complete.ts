import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { assets, identityAssets, presenterIdentities } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { assertIdentityObjectKey, type IdentityRole } from "@/lib/r2/keys";
import { requireCurrentConsent } from "./consent";
import { VIDEO_MAX_SECONDS, VIDEO_MIN_SECONDS } from "./copy";
import { countCurrentIdentitySlots } from "./queries";
import { IDENTITY_SLOTS } from "./slots";

export async function completeIdentityAsset(
  db: Db,
  input: {
    workspaceId: string;
    userId: string;
    identityId: string;
    role: IdentityRole;
    objectKey: string;
    mimeType: string;
    sizeBytes: number;
    durationSeconds?: number | null;
  },
) {
  await requireCurrentConsent(db, input.identityId, input.userId);
  assertIdentityObjectKey(input.objectKey, input.workspaceId, input.userId, input.role);

  if (input.role === "IDENTITY_VIDEO") {
    const duration = input.durationSeconds ?? 0;
    if (duration < VIDEO_MIN_SECONDS || duration > VIDEO_MAX_SECONDS) {
      throw new Error("The reference video must be about 8 to 15 seconds.");
    }
  }

  const now = new Date();
  const [existingKey] = await db
    .select({ id: assets.id })
    .from(assets)
    .where(and(eq(assets.r2ObjectKey, input.objectKey), isNull(assets.deletedAt)))
    .limit(1);
  if (existingKey) {
    return { assetId: existingKey.id, previousKeys: [] as string[] };
  }

  const previous = await db
    .select({
      linkId: identityAssets.id,
      assetId: assets.id,
      objectKey: assets.r2ObjectKey,
    })
    .from(identityAssets)
    .innerJoin(assets, eq(identityAssets.assetId, assets.id))
    .where(
      and(
        eq(identityAssets.identityId, input.identityId),
        eq(identityAssets.role, input.role),
        isNull(assets.deletedAt),
      ),
    );

  const previousKeys: string[] = [];
  for (const row of previous) {
    previousKeys.push(row.objectKey);
    await db.delete(identityAssets).where(eq(identityAssets.id, row.linkId));
    await db
      .update(assets)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(assets.id, row.assetId));
  }

  const assetId = newId();
  await db.insert(assets).values({
    id: assetId,
    workspaceId: input.workspaceId,
    ownerUserId: input.userId,
    category: "identity",
    role: input.role,
    r2ObjectKey: input.objectKey,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    durationSeconds: input.role === "IDENTITY_VIDEO" ? (input.durationSeconds ?? null) : null,
    status: "ready",
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(identityAssets).values({
    id: newId(),
    identityId: input.identityId,
    assetId,
    role: input.role,
    createdAt: now,
  });

  const filled = await countCurrentIdentitySlots(db, input.identityId);
  await db
    .update(presenterIdentities)
    .set({
      status: filled === IDENTITY_SLOTS.length ? "complete" : "incomplete",
      updatedAt: now,
    })
    .where(eq(presenterIdentities.id, input.identityId));

  return { assetId, previousKeys };
}
