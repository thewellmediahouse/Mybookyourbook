import { test } from "node:test";
import assert from "node:assert/strict";
import { and, eq } from "drizzle-orm";
import { createDb } from "@/lib/db/client";
import { auditLogs, profiles, user, workspaceInvitations, workspaceMembers } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { AuthzError } from "@/lib/authz/errors";
import { requireWorkspaceMember } from "@/lib/authz/guards";
import { createWorkspaceForOwner } from "@/lib/workspaces/create";
import { brandsDescription, inviteEmailBody, teamDescription } from "./copy";
import { acceptInvitation, createInvitation, generateInviteToken, hashInviteToken, peekInvitation } from "./invite";
import { canChangeMemberRole, changeMemberRole } from "./members";
import { safeInviteNext } from "@/lib/auth/redirect";
import type { EmailQueueMessage } from "@/lib/notifications/messages";

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

test("invite next only allows invitation accept URLs", () => {
  const token = "a".repeat(64);
  assert.equal(safeInviteNext(`/invite/accept?token=${token}`), `/invite/accept?token=${token}`);
  assert.equal(safeInviteNext("https://evil.example/invite/accept?token=" + token), null);
  assert.equal(safeInviteNext("/dashboard"), null);
  assert.equal(safeInviteNext("//evil.example"), null);
});

test("agency copy does not promise a client portal", () => {
  assert.match(teamDescription("AGENCY"), /not available yet/i);
  assert.match(brandsDescription("AGENCY"), /more than one client brand/i);
  assert.equal(teamDescription("BUSINESS").includes("client login"), false);
});

test("invite token is hashed, VIEWER cannot invite, accept lists the member, role change is logged", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const stamp = Date.now();

  const owner = await insertPerson(db, `phase21.o.${stamp}@cineyou.test`, "Owner TwentyOne");
  const viewer = await insertPerson(db, `phase21.v.${stamp}@cineyou.test`, "Viewer TwentyOne");
  const invitee = await insertPerson(db, `phase21.i.${stamp}@cineyou.test`, "Invitee TwentyOne");
  const studio = await createWorkspaceForOwner(db, {
    ownerUserId: owner,
    name: `Phase TwentyOne ${stamp}`,
    type: "AGENCY",
    country: "ZA",
    business: { name: `Client One ${stamp}` },
  });
  await db.insert(workspaceMembers).values({
    id: newId(),
    workspaceId: studio.workspaceId,
    userId: viewer,
    role: "VIEWER",
    status: "active",
    joinedAt: new Date(),
    createdAt: new Date(),
  });

  const ownerCtx = await requireWorkspaceMember(db, owner, studio.workspaceId);
  const viewerCtx = await requireWorkspaceMember(db, viewer, studio.workspaceId);
  const emails: EmailQueueMessage[] = [];
  const sink = {
    appUrl: "http://localhost:3000",
    enqueueEmail: async (message: EmailQueueMessage) => {
      emails.push(message);
    },
  };

  await assert.rejects(
    () => createInvitation(db, viewerCtx, { email: `phase21.x.${stamp}@cineyou.test`, role: "CREATOR" }, sink),
    (error: unknown) => error instanceof AuthzError && error.code === "FORBIDDEN",
  );
  assert.equal(emails.length, 0);

  const invited = await createInvitation(
    db,
    ownerCtx,
    { email: `phase21.i.${stamp}@cineyou.test`, role: "CREATOR" },
    sink,
  );
  const [stored] = await db
    .select()
    .from(workspaceInvitations)
    .where(eq(workspaceInvitations.id, invited.invitationId))
    .limit(1);
  assert.ok(stored);
  assert.notEqual(stored.tokenHash, invited.token);
  assert.equal(stored.tokenHash, await hashInviteToken(invited.token));
  assert.ok(stored.expiresAt.getTime() > Date.now());
  assert.equal(emails.length, 1);
  assert.equal(emails[0]?.template, "team-invite");
  assert.match(emails[0]?.body ?? "", new RegExp(inviteEmailBody(ownerCtx.workspace.name)));
  assert.equal(emails[0]?.actionUrl, `/invite/accept?token=${invited.token}`);

  const preview = await peekInvitation(db, invited.token);
  assert.equal(preview?.workspaceName, ownerCtx.workspace.name);
  assert.equal(preview?.accepted, false);

  await assert.rejects(
    () => acceptInvitation(db, { userId: owner, email: `phase21.o.${stamp}@cineyou.test`, token: invited.token }),
    /sign in with the email/i,
  );

  const joined = await acceptInvitation(db, {
    userId: invitee,
    email: `phase21.i.${stamp}@cineyou.test`,
    token: invited.token,
  });
  assert.equal(joined.workspaceId, studio.workspaceId);

  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, studio.workspaceId), eq(workspaceMembers.userId, invitee)))
    .limit(1);
  assert.equal(member?.role, "CREATOR");
  assert.equal(member?.status, "active");

  await assert.rejects(
    () => changeMemberRole(db, viewerCtx, { memberId: member!.id, role: "ADMIN" }),
    (error: unknown) => error instanceof AuthzError && error.code === "FORBIDDEN",
  );

  await changeMemberRole(db, ownerCtx, { memberId: member!.id, role: "ADMIN" });
  const [updated] = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.id, member!.id))
    .limit(1);
  assert.equal(updated?.role, "ADMIN");

  const [log] = await db
    .select()
    .from(auditLogs)
    .where(and(eq(auditLogs.workspaceId, studio.workspaceId), eq(auditLogs.action, "member.role_changed")))
    .limit(1);
  assert.ok(log);
  assert.equal(log.actorUserId, owner);
  assert.equal(log.targetId, member!.id);
  const meta = JSON.parse(log.metadataJson ?? "{}") as { from?: string; to?: string };
  assert.equal(meta.from, "CREATOR");
  assert.equal(meta.to, "ADMIN");

  const raw = generateInviteToken();
  await db.insert(workspaceInvitations).values({
    id: newId(),
    workspaceId: studio.workspaceId,
    email: `phase21.exp.${stamp}@cineyou.test`,
    role: "VIEWER",
    tokenHash: await hashInviteToken(raw),
    invitedBy: owner,
    expiresAt: new Date(Date.now() - 1000),
    createdAt: new Date(),
  });
  const expiredUser = await insertPerson(db, `phase21.exp.${stamp}@cineyou.test`, "Expired TwentyOne");
  await assert.rejects(
    () => acceptInvitation(db, { userId: expiredUser, email: `phase21.exp.${stamp}@cineyou.test`, token: raw }),
    /not valid or has expired/i,
  );

  assert.equal(canChangeMemberRole("OWNER", "OWNER", false), false);
  assert.equal(canChangeMemberRole("ADMIN", "ADMIN", false), false);
  assert.equal(canChangeMemberRole("VIEWER", "CREATOR", false), false);
  assert.equal(canChangeMemberRole("OWNER", "CREATOR", true), false);
});
