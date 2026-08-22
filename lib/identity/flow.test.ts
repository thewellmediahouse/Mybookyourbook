import { test } from "node:test";
import assert from "node:assert/strict";
import { createDb } from "@/lib/db/client";
import { profiles, user, workspaceMembers } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { requireAssetAccess } from "@/lib/authz/guards";
import { AuthzError } from "@/lib/authz/errors";
import { listMediaAssets } from "@/lib/dashboard/summary";
import { ObjectKeyError, identityObjectKey } from "@/lib/r2/keys";
import { deleteWorkspaceObject, getWorkspaceObject, putWorkspaceObject } from "@/lib/r2/bucket";
import { createWorkspaceForOwner } from "@/lib/workspaces/create";
import { completeIdentityAsset } from "./complete";
import { getOrCreateIdentity, recordIdentityConsent } from "./consent";
import { scheduleIdentityDelete } from "./delete";
import { getIdentityBundle } from "./queries";
import type { IdentityRole } from "@/lib/r2/keys";

async function insertPerson(db: ReturnType<typeof createDb>, email: string, name: string) {
  const id = newId();
  const now = new Date();
  await db.insert(user).values({
    id,
    name,
    email,
    emailVerified: true,
    firstName: name.split(" ")[0],
    lastName: name.split(" ").slice(1).join(" ") || name,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(profiles).values({
    userId: id,
    firstName: name.split(" ")[0] ?? "Test",
    lastName: name.split(" ").slice(1).join(" ") || "User",
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

test("identity consent, isolation, media exclusion, and private R2", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const bucket = proxy.env.MEDIA_BUCKET as R2Bucket;
  const stamp = Date.now();

  const owner = await insertPerson(db, `phase8.${stamp}@cineyou.test`, "Owner Eight");
  const teammate = await insertPerson(db, `phase8.t.${stamp}@cineyou.test`, "Teammate Eight");
  const studio = await createWorkspaceForOwner(db, {
    ownerUserId: owner,
    name: `Phase Eight ${stamp}`,
    type: "BUSINESS",
    country: "ZA",
    business: { name: `Phase Eight Brand ${stamp}` },
  });
  const other = await createWorkspaceForOwner(db, {
    ownerUserId: owner,
    name: `Phase Eight Other ${stamp}`,
    type: "BUSINESS",
    country: "ZA",
    business: { name: `Other Brand ${stamp}` },
  });
  const now = new Date();
  await db.insert(workspaceMembers).values({
    id: newId(),
    workspaceId: studio.workspaceId,
    userId: teammate,
    role: "ADMIN",
    status: "active",
    joinedAt: now,
    createdAt: now,
  });

  const identity = await getOrCreateIdentity(db, studio.workspaceId, owner);
  const objectId = newId();
  const frontKey = identityObjectKey(studio.workspaceId, owner, "IDENTITY_FRONT", objectId);
  const bytes = new TextEncoder().encode("identity-front");

  await assert.rejects(
    () =>
      completeIdentityAsset(db, {
        workspaceId: studio.workspaceId,
        userId: owner,
        identityId: identity.id,
        role: "IDENTITY_FRONT",
        objectKey: frontKey,
        mimeType: "image/jpeg",
        sizeBytes: bytes.byteLength,
      }),
    (error: unknown) => error instanceof Error && error.message.includes("Consent is required"),
  );

  await recordIdentityConsent(db, {
    userId: owner,
    workspaceId: studio.workspaceId,
    identityId: identity.id,
  });

  await assert.rejects(
    () =>
      putWorkspaceObject(bucket, {
        workspaceId: studio.workspaceId,
        objectKey: identityObjectKey(other.workspaceId, owner, "IDENTITY_FRONT", newId()),
        body: bytes,
        mimeType: "image/jpeg",
      }),
    (error: unknown) => error instanceof ObjectKeyError,
  );

  await putWorkspaceObject(bucket, {
    workspaceId: studio.workspaceId,
    objectKey: frontKey,
    body: bytes,
    mimeType: "image/jpeg",
  });
  const stored = await getWorkspaceObject(bucket, studio.workspaceId, frontKey);
  assert.ok(stored);
  assert.equal(await stored.text(), "identity-front");

  const first = await completeIdentityAsset(db, {
    workspaceId: studio.workspaceId,
    userId: owner,
    identityId: identity.id,
    role: "IDENTITY_FRONT",
    objectKey: frontKey,
    mimeType: "image/jpeg",
    sizeBytes: bytes.byteLength,
  });

  const replacementId = newId();
  const replacementKey = identityObjectKey(studio.workspaceId, owner, "IDENTITY_FRONT", replacementId);
  await putWorkspaceObject(bucket, {
    workspaceId: studio.workspaceId,
    objectKey: replacementKey,
    body: new TextEncoder().encode("identity-front-2"),
    mimeType: "image/jpeg",
  });
  const replaced = await completeIdentityAsset(db, {
    workspaceId: studio.workspaceId,
    userId: owner,
    identityId: identity.id,
    role: "IDENTITY_FRONT",
    objectKey: replacementKey,
    mimeType: "image/jpeg",
    sizeBytes: 16,
  });
  assert.deepEqual(replaced.previousKeys, [frontKey]);

  const remaining: IdentityRole[] = ["IDENTITY_LEFT", "IDENTITY_RIGHT", "IDENTITY_VIDEO"];
  for (const role of remaining) {
    const key = identityObjectKey(studio.workspaceId, owner, role, newId());
    await putWorkspaceObject(bucket, {
      workspaceId: studio.workspaceId,
      objectKey: key,
      body: bytes,
      mimeType: role === "IDENTITY_VIDEO" ? "video/webm" : "image/jpeg",
    });
    await completeIdentityAsset(db, {
      workspaceId: studio.workspaceId,
      userId: owner,
      identityId: identity.id,
      role,
      objectKey: key,
      mimeType: role === "IDENTITY_VIDEO" ? "video/webm" : "image/jpeg",
      sizeBytes: bytes.byteLength,
      durationSeconds: role === "IDENTITY_VIDEO" ? 12 : null,
    });
  }

  const bundle = await getIdentityBundle(db, studio.workspaceId, owner);
  assert.equal(bundle?.status, "complete");
  assert.equal(bundle?.consented, true);
  assert.ok(bundle?.assets.IDENTITY_FRONT);
  assert.equal(bundle?.assets.IDENTITY_FRONT?.assetId, replaced.assetId);

  await assert.rejects(
    () => requireAssetAccess(db, teammate, first.assetId),
    (error: unknown) => error instanceof AuthzError && error.code === "FORBIDDEN",
  );
  await assert.rejects(
    () => requireAssetAccess(db, teammate, replaced.assetId),
    (error: unknown) => error instanceof AuthzError && error.code === "FORBIDDEN",
  );
  const ownerAccess = await requireAssetAccess(db, owner, replaced.assetId);
  assert.equal(ownerAccess.asset.category, "identity");

  const library = await listMediaAssets(db, studio.workspaceId);
  assert.equal(
    library.some((item) => item.category === "identity"),
    false,
  );

  const removed = await scheduleIdentityDelete(db, identity.id, "all");
  assert.ok(removed.length >= 1);
  for (const key of removed) {
    await deleteWorkspaceObject(bucket, studio.workspaceId, key);
  }
  const afterDelete = await getIdentityBundle(db, studio.workspaceId, owner);
  assert.equal(afterDelete?.status, "incomplete");
  assert.equal(Object.keys(afterDelete?.assets ?? {}).length, 0);
});
