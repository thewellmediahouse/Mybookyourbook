import { test } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { createDb } from "@/lib/db/client";
import { assets, businesses, profiles, projects, user, workspaceMembers, workspaces } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { AuthzError } from "./errors";
import {
  assertCanManageBilling,
  assertCanManageBrands,
  assertCanStartProduction,
  assertPlatformAdmin,
  requireAssetAccess,
  requireBusinessAccess,
  requireProjectAccess,
  requireWorkspaceMember,
  requireWorkspaceRole,
} from "./guards";
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

test("workspace isolation, roles, and suspended production", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const stamp = Date.now();

  const ownerA = await insertPerson(db, `phase4.a.${stamp}@cineyou.test`, "Owner Alpha");
  const ownerB = await insertPerson(db, `phase4.b.${stamp}@cineyou.test`, "Owner Bravo");
  const viewer = await insertPerson(db, `phase4.v.${stamp}@cineyou.test`, "Viewer User");
  const creator = await insertPerson(db, `phase4.c.${stamp}@cineyou.test`, "Creator User");
  const adminMember = await insertPerson(db, `phase4.m.${stamp}@cineyou.test`, "Admin Member");
  const suspended = await insertPerson(db, `phase4.s.${stamp}@cineyou.test`, "Suspended User");

  const studioA = await createWorkspaceForOwner(db, {
    ownerUserId: ownerA,
    name: `Alpha Studio ${stamp}`,
    type: "BUSINESS",
    country: "ZA",
    business: { name: `Alpha Brand ${stamp}` },
  });
  const studioB = await createWorkspaceForOwner(db, {
    ownerUserId: ownerB,
    name: `Bravo Studio ${stamp}`,
    type: "AGENCY",
    country: "INT",
    business: { name: `Bravo Brand ${stamp}` },
  });

  const now = new Date();
  await db.insert(workspaceMembers).values([
    {
      id: newId(),
      workspaceId: studioA.workspaceId,
      userId: viewer,
      role: "VIEWER",
      status: "active",
      joinedAt: now,
      createdAt: now,
    },
    {
      id: newId(),
      workspaceId: studioA.workspaceId,
      userId: creator,
      role: "CREATOR",
      status: "active",
      joinedAt: now,
      createdAt: now,
    },
    {
      id: newId(),
      workspaceId: studioA.workspaceId,
      userId: adminMember,
      role: "ADMIN",
      status: "active",
      joinedAt: now,
      createdAt: now,
    },
    {
      id: newId(),
      workspaceId: studioA.workspaceId,
      userId: suspended,
      role: "CREATOR",
      status: "suspended",
      joinedAt: now,
      createdAt: now,
    },
  ]);

  await assert.rejects(
    () => requireWorkspaceMember(db, ownerA, studioB.workspaceId),
    (error: unknown) => error instanceof AuthzError && error.code === "FORBIDDEN",
  );

  const viewerCtx = await requireWorkspaceMember(db, viewer, studioA.workspaceId);
  assert.throws(
    () => assertCanStartProduction(viewerCtx),
    (error: unknown) => error instanceof AuthzError && error.code === "FORBIDDEN",
  );

  const creatorCtx = await requireWorkspaceMember(db, creator, studioA.workspaceId);
  assert.doesNotThrow(() => assertCanStartProduction(creatorCtx));
  assert.throws(
    () => assertCanManageBrands(creatorCtx),
    (error: unknown) => error instanceof AuthzError && error.code === "FORBIDDEN",
  );
  assert.throws(
    () => assertCanManageBilling(creatorCtx),
    (error: unknown) => error instanceof AuthzError && error.code === "FORBIDDEN",
  );

  const adminCtx = await requireWorkspaceMember(db, adminMember, studioA.workspaceId);
  assert.doesNotThrow(() => assertCanStartProduction(adminCtx));
  assert.doesNotThrow(() => assertCanManageBrands(adminCtx));
  assert.throws(
    () => assertCanManageBilling(adminCtx),
    (error: unknown) => error instanceof AuthzError && error.code === "FORBIDDEN",
  );

  const ownerCtx = await requireWorkspaceMember(db, ownerA, studioA.workspaceId);
  assert.doesNotThrow(() => assertCanManageBilling(ownerCtx));
  await requireWorkspaceRole(db, ownerA, studioA.workspaceId, "OWNER");

  await assert.rejects(
    () => requireWorkspaceRole(db, viewer, studioA.workspaceId, "CREATOR"),
    (error: unknown) => error instanceof AuthzError && error.code === "FORBIDDEN",
  );

  const suspendedCtx = await requireWorkspaceMember(db, suspended, studioA.workspaceId);
  assert.throws(
    () => assertCanStartProduction(suspendedCtx),
    (error: unknown) => error instanceof AuthzError && error.code === "SUSPENDED",
  );

  await db
    .update(workspaces)
    .set({ status: "suspended", updatedAt: new Date() })
    .where(eq(workspaces.id, studioA.workspaceId));
  const paused = await requireWorkspaceMember(db, creator, studioA.workspaceId);
  assert.throws(
    () => assertCanStartProduction(paused),
    (error: unknown) => error instanceof AuthzError && error.code === "SUSPENDED",
  );
  await db
    .update(workspaces)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(workspaces.id, studioA.workspaceId));

  await assert.rejects(
    () => requireBusinessAccess(db, ownerA, studioB.businessId),
    (error: unknown) => error instanceof AuthzError && error.code === "FORBIDDEN",
  );
  const business = await requireBusinessAccess(db, ownerA, studioA.businessId);
  assert.equal(business.business.id, studioA.businessId);

  const projectId = newId();
  const assetId = newId();
  await db.insert(projects).values({
    id: projectId,
    workspaceId: studioB.workspaceId,
    businessId: studioB.businessId,
    createdByUserId: ownerB,
    title: "Other commercial",
    duration: 30,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(assets).values({
    id: assetId,
    workspaceId: studioB.workspaceId,
    ownerUserId: ownerB,
    category: "final",
    role: "master",
    r2ObjectKey: `workspaces/${studioB.workspaceId}/projects/${projectId}/final/master/test.mp4`,
    mimeType: "video/mp4",
    sizeBytes: 1,
    status: "ready",
    createdAt: now,
    updatedAt: now,
  });

  await assert.rejects(
    () => requireProjectAccess(db, ownerA, projectId),
    (error: unknown) => error instanceof AuthzError && error.code === "FORBIDDEN",
  );
  await assert.rejects(
    () => requireAssetAccess(db, ownerA, assetId),
    (error: unknown) => error instanceof AuthzError && error.code === "FORBIDDEN",
  );

  assert.throws(
    () => assertPlatformAdmin("viewer@cineyou.com", ["staff@cineyou.com"]),
    (error: unknown) => error instanceof AuthzError && error.code === "FORBIDDEN",
  );
  assert.doesNotThrow(() => assertPlatformAdmin("staff@cineyou.com", ["staff@cineyou.com"]));

  const [walletBrand] = await db
    .select({ name: businesses.name })
    .from(businesses)
    .where(eq(businesses.id, studioA.businessId));
  assert.equal(walletBrand?.name, `Alpha Brand ${stamp}`);
});
