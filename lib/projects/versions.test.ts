import { test } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { createDb } from "@/lib/db/client";
import { assets, profiles, projectReferences, projects, user, workspaceMembers } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { AuthzError } from "@/lib/authz/errors";
import { requireProjectAccess, requireWorkspaceMember } from "@/lib/authz/guards";
import { createWorkspaceForOwner } from "@/lib/workspaces/create";
import { archiveProject, deleteProject } from "./manage";
import { getProjectBrief } from "./queries";
import { attachProjectReference } from "./references";
import { createDraftProject, updateDraftBrief } from "./save";
import { createFormatVersion, createVariation, duplicateProject } from "./versions";

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

test("duplicate, variation, and format versions copy the brief without the finished file", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const stamp = Date.now();
  const owner = await insertPerson(db, `phase19.${stamp}@cineyou.test`, "Owner Nineteen");
  const viewer = await insertPerson(db, `phase19.v.${stamp}@cineyou.test`, "Viewer Nineteen");
  const studio = await createWorkspaceForOwner(db, {
    ownerUserId: owner,
    name: `Phase Nineteen ${stamp}`,
    type: "BUSINESS",
    country: "ZA",
    business: { name: `Harbour Tours ${stamp}` },
  });
  const now = new Date();
  await db.insert(workspaceMembers).values({
    id: newId(),
    workspaceId: studio.workspaceId,
    userId: viewer,
    role: "VIEWER",
    status: "active",
    joinedAt: now,
    createdAt: now,
  });
  const member = await requireWorkspaceMember(db, owner, studio.workspaceId);
  const viewerCtx = await requireWorkspaceMember(db, viewer, studio.workspaceId);

  const sourceId = await createDraftProject(db, member, {
    businessId: studio.businessId,
    createdByUserId: owner,
    title: "Summer Harbour",
  });
  await updateDraftBrief(db, member, sourceId, {
    objective: "Service",
    targetCustomer: "Boat owners",
    offer: "Sunset cruise",
    ctaType: "Call",
    ctaValue: "021 000 0000",
    style: "Cinematic",
    platform: "YouTube",
    aspectRatio: "16:9",
    duration: 30,
  });

  const stillId = newId();
  await db.insert(assets).values({
    id: stillId,
    workspaceId: studio.workspaceId,
    ownerUserId: owner,
    businessId: studio.businessId,
    category: "library",
    role: "location",
    r2ObjectKey: `workspaces/${studio.workspaceId}/brands/${studio.businessId}/assets/location/${newId()}`,
    mimeType: "image/jpeg",
    sizeBytes: 12,
    status: "ready",
    createdAt: now,
    updatedAt: now,
  });
  await attachProjectReference(db, {
    projectId: sourceId,
    assetId: stillId,
    workspaceId: studio.workspaceId,
  });

  const finalId = newId();
  await db.insert(assets).values({
    id: finalId,
    workspaceId: studio.workspaceId,
    ownerUserId: owner,
    businessId: studio.businessId,
    projectId: sourceId,
    category: "final",
    role: "master",
    r2ObjectKey: `workspaces/${studio.workspaceId}/projects/${sourceId}/final/master/${finalId}`,
    mimeType: "video/mp4",
    sizeBytes: 99,
    status: "ready",
    createdAt: now,
    updatedAt: now,
  });
  await db
    .update(projects)
    .set({
      status: "READY",
      currentCreativeVersionId: "crev_not_copied",
      updatedAt: now,
    })
    .where(eq(projects.id, sourceId));

  await assert.rejects(
    () => duplicateProject(db, viewerCtx, sourceId),
    (error: unknown) => error instanceof AuthzError && error.code === "FORBIDDEN",
  );

  const copyId = await duplicateProject(db, member, sourceId);
  assert.notEqual(copyId, sourceId);
  const copy = await getProjectBrief(db, copyId);
  assert.equal(copy?.status, "DRAFT");
  assert.equal(copy?.title, "Summer Harbour (copy)");
  assert.equal(copy?.objective, "Service");
  assert.equal(copy?.ctaType, "Call");
  assert.equal(copy?.ctaValue, "021 000 0000");
  assert.equal(copy?.aspectRatio, "16:9");
  assert.equal(copy?.style, "Cinematic");
  assert.equal(copy?.references.length, 1);
  assert.equal(copy?.references[0]?.assetId, stillId);
  const [copyRow] = await db.select().from(projects).where(eq(projects.id, copyId)).limit(1);
  assert.equal(copyRow?.currentCreativeVersionId, null);
  const copyFinals = await db
    .select({ id: assets.id, category: assets.category })
    .from(assets)
    .where(eq(assets.projectId, copyId));
  assert.equal(copyFinals.some((row) => row.category === "final"), false);
  assert.equal(
    copyFinals.some((row) => row.id === finalId),
    false,
  );

  await assert.rejects(
    () => createFormatVersion(db, member, sourceId, "16:9"),
    (error: unknown) =>
      error instanceof Error &&
      error.message === "This commercial is already landscape. A new aspect ratio requires a new AI production and uses 1 Ad Credit.",
  );

  const verticalId = await createFormatVersion(db, member, sourceId, "9:16");
  const vertical = await getProjectBrief(db, verticalId);
  assert.equal(vertical?.status, "DRAFT");
  assert.equal(vertical?.aspectRatio, "9:16");
  assert.equal(vertical?.title, "Summer Harbour (vertical)");
  const verticalAssets = await db.select().from(assets).where(eq(assets.projectId, verticalId));
  assert.equal(verticalAssets.some((row) => row.category === "final"), false);

  const funnyId = await createVariation(db, member, sourceId, "funnier");
  const funny = await getProjectBrief(db, funnyId);
  assert.equal(funny?.style, "Funny");
  assert.equal(funny?.aspectRatio, "16:9");
  assert.equal(funny?.title, "Summer Harbour (Funnier)");

  await archiveProject(db, member, sourceId);
  const [archived] = await db.select().from(projects).where(eq(projects.id, sourceId)).limit(1);
  assert.equal(archived?.status, "ARCHIVED");
  await requireProjectAccess(db, owner, sourceId);

  await deleteProject(db, member, sourceId);
  assert.equal(await getProjectBrief(db, sourceId), null);
  await assert.rejects(
    () => requireProjectAccess(db, owner, sourceId),
    (error: unknown) => error instanceof AuthzError && error.code === "FORBIDDEN",
  );

  const leftoverRefs = await db
    .select({ id: projectReferences.id })
    .from(projectReferences)
    .where(eq(projectReferences.projectId, copyId));
  assert.equal(leftoverRefs.length, 1);
});
