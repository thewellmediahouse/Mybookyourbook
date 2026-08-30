import { test } from "node:test";
import assert from "node:assert/strict";
import { createDb } from "@/lib/db/client";
import { createWorkspaceForOwner } from "@/lib/workspaces/create";
import { profiles, user } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { completeLogoAsset } from "@/lib/businesses/logo";
import { ObjectKeyError } from "@/lib/r2/keys";
import { logoObjectKey } from "@/lib/r2/keys";
import { deleteWorkspaceObject, getWorkspaceObject, putWorkspaceObject } from "@/lib/r2/bucket";
import { getBrandLogoAsset } from "@/lib/businesses/queries";
import { FIXTURE_IMAGE_MIME, FIXTURE_JPEG } from "@/lib/providers/video/fixture";

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

test("logo round-trip stores bytes in R2 and metadata only in D1", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const bucket = proxy.env.MEDIA_BUCKET as R2Bucket;
  const stamp = Date.now();
  const owner = await insertPerson(db, `phase7.${stamp}@cineyou.test`, "Owner Seven");
  const studio = await createWorkspaceForOwner(db, {
    ownerUserId: owner,
    name: `Phase Seven ${stamp}`,
    type: "BUSINESS",
    country: "ZA",
    business: { name: `Phase Seven Brand ${stamp}` },
  });
  const other = await createWorkspaceForOwner(db, {
    ownerUserId: owner,
    name: `Phase Seven Other ${stamp}`,
    type: "BUSINESS",
    country: "ZA",
    business: { name: `Other Brand ${stamp}` },
  });

  const objectId = newId();
  const key = logoObjectKey(studio.workspaceId, studio.businessId, objectId);
  const bytes = FIXTURE_JPEG;
  await putWorkspaceObject(bucket, {
    workspaceId: studio.workspaceId,
    objectKey: key,
    body: bytes,
    mimeType: FIXTURE_IMAGE_MIME,
  });
  const stored = await getWorkspaceObject(bucket, studio.workspaceId, key);
  assert.ok(stored);
  assert.equal((await stored.arrayBuffer()).byteLength, bytes.byteLength);

  await assert.rejects(
    () =>
      putWorkspaceObject(bucket, {
        workspaceId: studio.workspaceId,
        objectKey: logoObjectKey(other.workspaceId, other.businessId, newId()),
        body: bytes,
        mimeType: FIXTURE_IMAGE_MIME,
      }),
    (error: unknown) => error instanceof ObjectKeyError,
  );

  const completed = await completeLogoAsset(db, {
    workspaceId: studio.workspaceId,
    businessId: studio.businessId,
    ownerUserId: owner,
    objectKey: key,
    mimeType: FIXTURE_IMAGE_MIME,
    sizeBytes: bytes.byteLength,
  });
  const logo = await getBrandLogoAsset(db, studio.businessId);
  assert.equal(logo?.assetId, completed.assetId);
  assert.equal(logo?.r2ObjectKey, key);
  assert.equal(logo?.mimeType, FIXTURE_IMAGE_MIME);

  await deleteWorkspaceObject(bucket, studio.workspaceId, key);
});
