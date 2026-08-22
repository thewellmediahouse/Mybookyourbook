import { test } from "node:test";
import assert from "node:assert/strict";
import { createDb } from "@/lib/db/client";
import { profiles, projects, user } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { createWorkspaceForOwner } from "@/lib/workspaces/create";
import { getDashboardSummary, listCommercials } from "./summary";

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

test("dashboard summary uses real workspace counts and never invents commercials", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const stamp = Date.now();
  const owner = await insertPerson(db, `phase6.${stamp}@cineyou.test`, "Owner Six");
  const studio = await createWorkspaceForOwner(db, {
    ownerUserId: owner,
    name: `Phase Six ${stamp}`,
    type: "BUSINESS",
    country: "ZA",
    business: { name: `Phase Six Brand ${stamp}` },
  });
  const other = await createWorkspaceForOwner(db, {
    ownerUserId: owner,
    name: `Phase Six Other ${stamp}`,
    type: "BUSINESS",
    country: "ZA",
    business: { name: `Other Brand ${stamp}` },
  });

  const empty = await getDashboardSummary(db, studio.workspaceId);
  assert.equal(empty.credits, 0);
  assert.equal(empty.commercialsCompleted, 0);
  assert.equal(empty.inProduction, 0);
  assert.equal(empty.ready, 0);
  assert.equal(empty.projectCount, 0);
  assert.equal((await listCommercials(db, studio.workspaceId)).length, 0);

  const now = new Date();
  await db.insert(projects).values([
    {
      id: newId(),
      workspaceId: studio.workspaceId,
      businessId: studio.businessId,
      createdByUserId: owner,
      title: "Ready commercial",
      status: "READY",
      duration: 30,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: newId(),
      workspaceId: studio.workspaceId,
      businessId: studio.businessId,
      createdByUserId: owner,
      title: "Filming now",
      status: "IN_PRODUCTION",
      duration: 30,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: newId(),
      workspaceId: other.workspaceId,
      businessId: other.businessId,
      createdByUserId: owner,
      title: "Other studio commercial",
      status: "READY",
      duration: 30,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  const summary = await getDashboardSummary(db, studio.workspaceId);
  assert.equal(summary.credits, 0);
  assert.equal(summary.commercialsCompleted, 1);
  assert.equal(summary.inProduction, 1);
  assert.equal(summary.ready, 1);
  assert.equal(summary.projectCount, 2);

  const list = await listCommercials(db, studio.workspaceId);
  assert.equal(list.length, 2);
  assert.equal(
    list.some((item) => item.title === "Other studio commercial"),
    false,
  );
});
