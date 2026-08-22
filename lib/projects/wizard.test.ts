import { test } from "node:test";
import assert from "node:assert/strict";
import { createDb } from "@/lib/db/client";
import { assets, profiles, user } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { requireWorkspaceMember } from "@/lib/authz/guards";
import { createWorkspaceForOwner } from "@/lib/workspaces/create";
import { attachProjectReference } from "./references";
import { getLatestDraft, getProjectBrief } from "./queries";
import { createDraftProject, updateDraftBrief } from "./save";

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

test("draft briefs autosave, resume, and keep identity out of references", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const stamp = Date.now();
  const owner = await insertPerson(db, `phase10.${stamp}@cineyou.test`, "Owner Ten");
  const otherOwner = await insertPerson(db, `phase10.b.${stamp}@cineyou.test`, "Owner Bravo");
  const studio = await createWorkspaceForOwner(db, {
    ownerUserId: owner,
    name: `Phase Ten ${stamp}`,
    type: "BUSINESS",
    country: "ZA",
    business: { name: `Phase Ten Brand ${stamp}` },
  });
  const other = await createWorkspaceForOwner(db, {
    ownerUserId: otherOwner,
    name: `Phase Ten Other ${stamp}`,
    type: "BUSINESS",
    country: "ZA",
    business: { name: `Other Brand ${stamp}` },
  });
  const member = await requireWorkspaceMember(db, owner, studio.workspaceId);
  const outsider = await requireWorkspaceMember(db, otherOwner, other.workspaceId);

  const projectId = await createDraftProject(db, member, {
    businessId: studio.businessId,
    createdByUserId: owner,
    title: "Harbour launch",
  });
  await updateDraftBrief(db, member, projectId, {
    objective: "Service",
    targetCustomer: "Boat owners",
    problem: "Slow bookings",
    valueProposition: "We handle the whole trip",
    offer: "Free consultation",
    ctaType: "Call",
    ctaValue: "021 000 0000",
    style: "Cinematic",
    tones: ["Warm", "Confident"],
    avoid: "Do not mention discounts",
    platform: "TikTok",
    aspectRatio: "9:16",
    duration: 30,
  });

  const resumed = await getLatestDraft(db, studio.workspaceId, owner);
  assert.equal(resumed?.id, projectId);
  assert.equal(resumed?.title, "Harbour launch");
  assert.equal(resumed?.objective, "Service");
  assert.equal(resumed?.ctaType, "Call");
  assert.equal(resumed?.style, "Cinematic");
  assert.deepEqual(resumed?.tones, ["Warm", "Confident"]);
  assert.equal(resumed?.avoid, "Do not mention discounts");
  assert.equal(resumed?.platform, "TikTok");
  assert.equal(resumed?.aspectRatio, "9:16");
  assert.equal(resumed?.duration, 30);

  await assert.rejects(
    () => updateDraftBrief(db, outsider, projectId, { title: "Stolen" }),
    (error: unknown) => error instanceof Error,
  );
  const stillOurs = await getProjectBrief(db, projectId);
  assert.equal(stillOurs?.title, "Harbour launch");

  const now = new Date();
  const identityAsset = newId();
  await db.insert(assets).values({
    id: identityAsset,
    workspaceId: studio.workspaceId,
    ownerUserId: owner,
    category: "identity",
    role: "IDENTITY_FRONT",
    r2ObjectKey: `workspaces/${studio.workspaceId}/users/${owner}/identity/front/${newId()}`,
    mimeType: "image/jpeg",
    sizeBytes: 12,
    status: "ready",
    createdAt: now,
    updatedAt: now,
  });
  await assert.rejects(
    () =>
      attachProjectReference(db, {
        projectId,
        assetId: identityAsset,
        workspaceId: studio.workspaceId,
      }),
    (error: unknown) =>
      error instanceof Error && error.message.includes("Identity files stay private"),
  );

  for (let index = 0; index < 6; index += 1) {
    const assetId = newId();
    await db.insert(assets).values({
      id: assetId,
      workspaceId: studio.workspaceId,
      ownerUserId: owner,
      businessId: studio.businessId,
      category: "library",
      role: "product",
      r2ObjectKey: `workspaces/${studio.workspaceId}/brands/${studio.businessId}/assets/product/${newId()}`,
      mimeType: "image/jpeg",
      sizeBytes: 12,
      status: "ready",
      createdAt: now,
      updatedAt: now,
    });
    await attachProjectReference(db, {
      projectId,
      assetId,
      workspaceId: studio.workspaceId,
    });
  }
  const extra = newId();
  await db.insert(assets).values({
    id: extra,
    workspaceId: studio.workspaceId,
    ownerUserId: owner,
    businessId: studio.businessId,
    category: "library",
    role: "product",
    r2ObjectKey: `workspaces/${studio.workspaceId}/brands/${studio.businessId}/assets/product/${newId()}`,
    mimeType: "image/jpeg",
    sizeBytes: 12,
    status: "ready",
    createdAt: now,
    updatedAt: now,
  });
  await assert.rejects(
    () =>
      attachProjectReference(db, {
        projectId,
        assetId: extra,
        workspaceId: studio.workspaceId,
      }),
    (error: unknown) => error instanceof Error && error.message.includes("up to 6"),
  );
});
