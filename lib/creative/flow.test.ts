import { test } from "node:test";
import assert from "node:assert/strict";
import { createDb } from "@/lib/db/client";
import { businesses, creativeVersions, profiles, user } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { requireWorkspaceMember } from "@/lib/authz/guards";
import { createWorkspaceForOwner } from "@/lib/workspaces/create";
import { createMockCreativeDirector } from "@/lib/ai/creative-director";
import { NO_GENERATED_TEXT_INSTRUCTION } from "@/lib/providers/video/seedance/prompt-builder";
import { createDraftProject, updateDraftBrief } from "@/lib/projects/save";
import { approveConcept } from "./approve";
import { generateConceptForProject } from "./generate";
import { assertConceptRateLimit, CONCEPT_RATE_MAX } from "./rate-limit";
import { eq } from "drizzle-orm";

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

test("approve creates an immutable creative version and hides the filming brief", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const stamp = Date.now();
  const owner = await insertPerson(db, `phase11.${stamp}@cineyou.test`, "Owner Eleven");
  const studio = await createWorkspaceForOwner(db, {
    ownerUserId: owner,
    name: `Phase Eleven ${stamp}`,
    type: "BUSINESS",
    country: "ZA",
    business: { name: `Harbour Legal ${stamp}`, industry: "law firm" },
  });
  await db
    .update(businesses)
    .set({ industry: "law firm" })
    .where(eq(businesses.id, studio.businessId));
  const member = await requireWorkspaceMember(db, owner, studio.workspaceId);
  const projectId = await createDraftProject(db, member, {
    businessId: studio.businessId,
    createdByUserId: owner,
    title: "Harbour launch",
  });
  await updateDraftBrief(db, member, projectId, {
    objective: "Service",
    ctaType: "Call",
    ctaValue: "021 000 0000",
    style: "Cinematic",
    platform: "TikTok",
    aspectRatio: "9:16",
    duration: 30,
  });

  const first = await generateConceptForProject(db, {
    projectId,
    workspaceId: studio.workspaceId,
    userId: owner,
    provider: createMockCreativeDirector(),
  });
  assert.equal(first.approved, false);
  assert.equal("generationPrompt" in first, false);
  assert.match(first.strategy, /credibility/i);

  const approved = await approveConcept(db, {
    projectId,
    workspaceId: studio.workspaceId,
    userId: owner,
    versionId: first.versionId,
  });
  assert.equal(approved.approved, true);

  const [approvedRow] = await db
    .select()
    .from(creativeVersions)
    .where(eq(creativeVersions.id, first.versionId));
  assert.ok(approvedRow?.approvedAt);
  assert.ok(approvedRow.seedancePrompt?.includes("@Image1 = identity front"));
  assert.ok(approvedRow.seedancePrompt?.includes("@Image2 = identity left"));
  assert.ok(approvedRow.seedancePrompt?.includes("@Image3 = identity right"));
  assert.ok(approvedRow.seedancePrompt?.includes("@Video1 = presenter video"));
  assert.ok(approvedRow.seedancePrompt?.includes(NO_GENERATED_TEXT_INSTRUCTION));
  assert.ok(approvedRow.approvedScript);
  assert.ok(approvedRow.seedancePrompt?.includes(approvedRow.approvedScript));
  assert.equal(approved.spokenScript, approvedRow.approvedScript);
  const approvedAt = approvedRow.approvedAt;
  const approvedHook = approvedRow.hook;
  const approvedPrompt = approvedRow.seedancePrompt;

  const second = await generateConceptForProject(db, {
    projectId,
    workspaceId: studio.workspaceId,
    userId: owner,
    provider: createMockCreativeDirector(),
  });
  assert.notEqual(second.versionId, first.versionId);
  assert.equal(second.approved, false);

  const [stillApproved] = await db
    .select()
    .from(creativeVersions)
    .where(eq(creativeVersions.id, first.versionId));
  assert.deepEqual(stillApproved?.approvedAt, approvedAt);
  assert.equal(stillApproved?.hook, approvedHook);
  assert.equal(stillApproved?.seedancePrompt, approvedPrompt);
  assert.equal(stillApproved?.approvedBy, owner);

  const payload = JSON.stringify(second);
  assert.doesNotMatch(payload, /generationPrompt|seedancePrompt|Seedance|OpenAI/i);

  const now = new Date();
  for (let index = 0; index < CONCEPT_RATE_MAX; index += 1) {
    await db.insert(creativeVersions).values({
      id: newId(),
      projectId,
      version: 20 + index,
      hook: "Rate limit",
      strategy: "n/a",
      spokenScript: "n/a",
      scenesJson: "[]",
      callToAction: "Call",
      createdAt: now,
    });
  }
  await assert.rejects(
    () => assertConceptRateLimit(db, studio.workspaceId),
    (error: unknown) => error instanceof Error && error.message.includes("few minutes"),
  );
});
