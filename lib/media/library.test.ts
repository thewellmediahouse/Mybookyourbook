import { test } from "node:test";
import assert from "node:assert/strict";
import { createDb } from "@/lib/db/client";
import { listMediaAssets } from "@/lib/dashboard/summary";
import { profiles, user, workspaceMembers } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { requireAssetAccess } from "@/lib/authz/guards";
import { AuthzError } from "@/lib/authz/errors";
import { completeIdentityAsset } from "@/lib/identity/complete";
import { getOrCreateIdentity, recordIdentityConsent } from "@/lib/identity/consent";
import { completeLibraryAsset } from "./complete";
import { scheduleLibraryDelete } from "./delete";
import { listLibraryAssets } from "./queries";
import {
  ObjectKeyError,
  identityObjectKey,
  libraryObjectKey,
} from "@/lib/r2/keys";
import { deleteWorkspaceObject, getWorkspaceObject, putWorkspaceObject } from "@/lib/r2/bucket";
import { createWorkspaceForOwner } from "@/lib/workspaces/create";

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

test("library upload is workspace-scoped, excludes identity, and delete cleans R2", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const bucket = proxy.env.MEDIA_BUCKET as R2Bucket;
  const stamp = Date.now();

  const owner = await insertPerson(db, `phase9.${stamp}@cineyou.test`, "Owner Nine");
  const teammate = await insertPerson(db, `phase9.t.${stamp}@cineyou.test`, "Teammate Nine");
  const otherOwner = await insertPerson(db, `phase9.b.${stamp}@cineyou.test`, "Owner Bravo");
  const studio = await createWorkspaceForOwner(db, {
    ownerUserId: owner,
    name: `Phase Nine ${stamp}`,
    type: "BUSINESS",
    country: "ZA",
    business: { name: `Phase Nine Brand ${stamp}` },
  });
  const other = await createWorkspaceForOwner(db, {
    ownerUserId: otherOwner,
    name: `Phase Nine Other ${stamp}`,
    type: "BUSINESS",
    country: "ZA",
    business: { name: `Other Brand ${stamp}` },
  });
  const now = new Date();
  await db.insert(workspaceMembers).values({
    id: newId(),
    workspaceId: studio.workspaceId,
    userId: teammate,
    role: "CREATOR",
    status: "active",
    joinedAt: now,
    createdAt: now,
  });

  const bytes = new TextEncoder().encode("library-product");
  await assert.rejects(
    () =>
      putWorkspaceObject(bucket, {
        workspaceId: studio.workspaceId,
        objectKey: libraryObjectKey(other.workspaceId, other.businessId, "product", newId()),
        body: bytes,
        mimeType: "image/jpeg",
      }),
    (error: unknown) => error instanceof ObjectKeyError,
  );

  const productKey = libraryObjectKey(studio.workspaceId, studio.businessId, "product", newId());
  await putWorkspaceObject(bucket, {
    workspaceId: studio.workspaceId,
    objectKey: productKey,
    body: bytes,
    mimeType: "image/jpeg",
  });
  const stored = await getWorkspaceObject(bucket, studio.workspaceId, productKey);
  assert.ok(stored);
  assert.equal(await stored.text(), "library-product");

  const completed = await completeLibraryAsset(db, {
    workspaceId: studio.workspaceId,
    businessId: studio.businessId,
    ownerUserId: owner,
    role: "product",
    objectKey: productKey,
    mimeType: "image/jpeg",
    sizeBytes: bytes.byteLength,
  });
  assert.deepEqual(Object.keys(completed).sort(), ["assetId"]);
  assert.equal("url" in completed, false);

  const identity = await getOrCreateIdentity(db, studio.workspaceId, owner);
  await recordIdentityConsent(db, {
    userId: owner,
    workspaceId: studio.workspaceId,
    identityId: identity.id,
  });
  const identityKey = identityObjectKey(studio.workspaceId, owner, "IDENTITY_FRONT", newId());
  await putWorkspaceObject(bucket, {
    workspaceId: studio.workspaceId,
    objectKey: identityKey,
    body: bytes,
    mimeType: "image/jpeg",
  });
  await completeIdentityAsset(db, {
    workspaceId: studio.workspaceId,
    userId: owner,
    identityId: identity.id,
    role: "IDENTITY_FRONT",
    objectKey: identityKey,
    mimeType: "image/jpeg",
    sizeBytes: bytes.byteLength,
  });
  await assert.rejects(
    () =>
      completeLibraryAsset(db, {
        workspaceId: studio.workspaceId,
        businessId: studio.businessId,
        ownerUserId: owner,
        role: "product",
        objectKey: identityKey,
        mimeType: "image/jpeg",
        sizeBytes: bytes.byteLength,
      }),
    (error: unknown) => error instanceof ObjectKeyError,
  );

  const tab = await listLibraryAssets(db, {
    workspaceId: studio.workspaceId,
    businessId: studio.businessId,
    role: "product",
  });
  assert.equal(tab.some((item) => item.id === completed.assetId), true);
  assert.equal(
    tab.some((item) => item.source === "library" && item.role === "product"),
    true,
  );

  const mediaList = await listMediaAssets(db, studio.workspaceId);
  assert.equal(
    mediaList.some((item) => item.category === "identity"),
    false,
  );
  assert.equal(
    mediaList.some((item) => item.id === completed.assetId),
    true,
  );

  const teammateAccess = await requireAssetAccess(db, teammate, completed.assetId);
  assert.equal(teammateAccess.asset.category, "library");
  await assert.rejects(
    () => requireAssetAccess(db, otherOwner, completed.assetId),
    (error: unknown) => error instanceof AuthzError && error.code === "FORBIDDEN",
  );

  const removed = await scheduleLibraryDelete(db, completed.assetId);
  assert.deepEqual(removed, [productKey]);
  for (const key of removed) {
    await deleteWorkspaceObject(bucket, studio.workspaceId, key);
  }
  assert.equal(await getWorkspaceObject(bucket, studio.workspaceId, productKey), null);
  const afterDelete = await listLibraryAssets(db, {
    workspaceId: studio.workspaceId,
    businessId: studio.businessId,
    role: "product",
  });
  assert.equal(
    afterDelete.some((item) => item.id === completed.assetId),
    false,
  );
});
