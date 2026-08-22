import { and, desc, eq, isNull } from "drizzle-orm";
import { assertCanManageMembers, type WorkspaceAuthz } from "@/lib/authz/guards";
import { isInvitableRole, type InvitableRole } from "@/lib/authz/roles";
import { normalizeEmail } from "@/lib/auth/password";
import type { Db } from "@/lib/db/client";
import { auditLogs, user, workspaceInvitations, workspaceMembers, workspaces } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { teamInviteEventKey } from "@/lib/notifications/copy";
import type { SideEffectSink } from "@/lib/notifications/notify";
import { inviteEmailBody, INVALID_INVITE, INVITE_WRONG_EMAIL } from "./copy";

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function generateInviteToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashInviteToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isInviteEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export type InvitationPreview = {
  workspaceId: string;
  workspaceName: string;
  role: InvitableRole;
  email: string;
  expired: boolean;
  accepted: boolean;
};

export async function createInvitation(
  db: Db,
  actor: WorkspaceAuthz,
  input: { email: string; role: string },
  sink: SideEffectSink,
): Promise<{ invitationId: string; token: string }> {
  assertCanManageMembers(actor);
  const email = normalizeEmail(input.email);
  if (!isInviteEmail(email)) {
    throw new Error("Enter a valid email address.");
  }
  if (!isInvitableRole(input.role)) {
    throw new Error("Choose Admin, Creator, or Viewer. A studio can have only one owner.");
  }
  const [actorUser] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, actor.userId))
    .limit(1);
  if (actorUser && normalizeEmail(actorUser.email) === email) {
    throw new Error("You are already in this studio.");
  }

  const [existingMember] = await db
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .innerJoin(user, eq(workspaceMembers.userId, user.id))
    .where(and(eq(workspaceMembers.workspaceId, actor.workspace.id), eq(user.email, email)))
    .limit(1);
  if (existingMember) {
    throw new Error("That person is already in this studio.");
  }

  const now = new Date();
  const token = generateInviteToken();
  const tokenHash = await hashInviteToken(token);
  const expiresAt = new Date(now.getTime() + INVITE_TTL_MS);

  const [pending] = await db
    .select()
    .from(workspaceInvitations)
    .where(
      and(
        eq(workspaceInvitations.workspaceId, actor.workspace.id),
        eq(workspaceInvitations.email, email),
        isNull(workspaceInvitations.acceptedAt),
      ),
    )
    .orderBy(desc(workspaceInvitations.createdAt))
    .limit(1);

  const invitationId = pending?.id ?? newId();
  if (pending) {
    await db
      .update(workspaceInvitations)
      .set({
        role: input.role,
        tokenHash,
        invitedBy: actor.userId,
        expiresAt,
      })
      .where(eq(workspaceInvitations.id, pending.id));
  } else {
    await db.insert(workspaceInvitations).values({
      id: invitationId,
      workspaceId: actor.workspace.id,
      email,
      role: input.role,
      tokenHash,
      invitedBy: actor.userId,
      expiresAt,
      createdAt: now,
    });
  }

  await db.insert(auditLogs).values({
    id: newId(),
    actorUserId: actor.userId,
    workspaceId: actor.workspace.id,
    action: "member.invited",
    targetType: "workspace_invitation",
    targetId: invitationId,
    metadataJson: JSON.stringify({ email, role: input.role }),
    createdAt: now,
  });

  const actionUrl = `/invite/accept?token=${token}`;
  await sendInviteEmail(sink, {
    to: email,
    invitationId,
    tokenHash,
    workspaceName: actor.workspace.name,
    actionUrl,
    appUrl: sink.appUrl,
  });

  return { invitationId, token };
}

async function sendInviteEmail(
  sink: SideEffectSink,
  input: {
    to: string;
    invitationId: string;
    tokenHash: string;
    workspaceName: string;
    actionUrl: string;
    appUrl: string;
  },
) {
  const message = {
    kind: "email" as const,
    template: "team-invite" as const,
    to: input.to,
    idempotencyKey: teamInviteEventKey(input.invitationId, input.tokenHash.slice(0, 16)),
    appUrl: input.appUrl,
    actionUrl: input.actionUrl,
    body: inviteEmailBody(input.workspaceName),
  };
  if (sink.enqueueEmail) {
    await sink.enqueueEmail(message);
    return;
  }
  const { dispatchEmail } = await import("@/lib/notifications/queue");
  await dispatchEmail(sink.env ?? {}, message);
}

export async function peekInvitation(db: Db, token: string): Promise<InvitationPreview | null> {
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return null;
  }
  const tokenHash = await hashInviteToken(token.toLowerCase());
  const [row] = await db
    .select({
      workspaceId: workspaceInvitations.workspaceId,
      workspaceName: workspaces.name,
      role: workspaceInvitations.role,
      email: workspaceInvitations.email,
      expiresAt: workspaceInvitations.expiresAt,
      acceptedAt: workspaceInvitations.acceptedAt,
    })
    .from(workspaceInvitations)
    .innerJoin(workspaces, eq(workspaceInvitations.workspaceId, workspaces.id))
    .where(eq(workspaceInvitations.tokenHash, tokenHash))
    .limit(1);
  if (!row) {
    return null;
  }
  return {
    workspaceId: row.workspaceId,
    workspaceName: row.workspaceName,
    role: row.role,
    email: row.email,
    expired: row.expiresAt.getTime() <= Date.now(),
    accepted: Boolean(row.acceptedAt),
  };
}

export async function acceptInvitation(
  db: Db,
  input: { userId: string; email: string; token: string },
): Promise<{ workspaceId: string; memberId: string }> {
  const preview = await peekInvitation(db, input.token);
  if (!preview || preview.expired || preview.accepted) {
    throw new Error(INVALID_INVITE);
  }
  if (normalizeEmail(input.email) !== preview.email) {
    throw new Error(INVITE_WRONG_EMAIL);
  }

  const now = new Date();
  const [existing] = await db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, preview.workspaceId), eq(workspaceMembers.userId, input.userId)))
    .limit(1);

  const tokenHash = await hashInviteToken(input.token.toLowerCase());
  const [invitation] = await db
    .select()
    .from(workspaceInvitations)
    .where(eq(workspaceInvitations.tokenHash, tokenHash))
    .limit(1);
  if (!invitation) {
    throw new Error(INVALID_INVITE);
  }

  let memberId = existing?.id ?? newId();
  if (!existing) {
    await db.insert(workspaceMembers).values({
      id: memberId,
      workspaceId: preview.workspaceId,
      userId: input.userId,
      role: preview.role,
      status: "active",
      invitedBy: invitation.invitedBy,
      joinedAt: now,
      createdAt: now,
    });
  } else {
    memberId = existing.id;
  }

  await db
    .update(workspaceInvitations)
    .set({ acceptedAt: now })
    .where(eq(workspaceInvitations.id, invitation.id));

  await db.insert(auditLogs).values({
    id: newId(),
    actorUserId: input.userId,
    workspaceId: preview.workspaceId,
    action: "member.joined",
    targetType: "workspace_member",
    targetId: memberId,
    metadataJson: JSON.stringify({ invitationId: invitation.id, role: preview.role }),
    createdAt: now,
  });

  return { workspaceId: preview.workspaceId, memberId };
}

export async function listPendingInvitations(db: Db, workspaceId: string) {
  const rows = await db
    .select({
      id: workspaceInvitations.id,
      email: workspaceInvitations.email,
      role: workspaceInvitations.role,
      expiresAt: workspaceInvitations.expiresAt,
      createdAt: workspaceInvitations.createdAt,
    })
    .from(workspaceInvitations)
    .where(and(eq(workspaceInvitations.workspaceId, workspaceId), isNull(workspaceInvitations.acceptedAt)))
    .orderBy(desc(workspaceInvitations.createdAt));
  const now = Date.now();
  return rows.map((row) => ({ ...row, expired: row.expiresAt.getTime() <= now }));
}
