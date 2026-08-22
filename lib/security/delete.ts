import { and, eq, inArray, isNull, ne } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import {
  account,
  assets,
  auditLogs,
  payments,
  productionJobs,
  profiles,
  projects,
  session,
  user,
  verification,
  workspaceMembers,
  workspaces,
} from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { getOrCreateIdentity } from "@/lib/identity/consent";
import { scheduleIdentityDelete } from "@/lib/identity/delete";
import { IN_FLIGHT_JOB_STATUSES } from "@/lib/production/status";
import {
  DELETE_CONFIRMATION,
  DELETE_CONFIRM_HINT,
  DELETE_HAS_TEAM,
  DELETE_IN_FLIGHT,
  DELETE_PASSWORD_WRONG,
} from "./copy";

export type DeleteAccountDeps = {
  hasPassword: boolean;
  verifyPassword?: (password: string) => Promise<boolean>;
  cancelOwnedSubscription: (workspaceId: string) => Promise<void>;
  enqueueCleanup: (workspaceId: string, objectKey: string) => Promise<void>;
  revokeSessions: () => Promise<void>;
};

export function closedAccountEmail(userId: string) {
  return `deleted.${userId.replace(/-/g, "")}@invalid.cineyou`;
}

async function ownedWorkspaces(db: Db, userId: string) {
  return db.select().from(workspaces).where(eq(workspaces.ownerUserId, userId));
}

async function assertSafeToDelete(db: Db, userId: string) {
  const owned = await ownedWorkspaces(db, userId);
  for (const studio of owned) {
    const others = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, studio.id),
          ne(workspaceMembers.userId, userId),
          eq(workspaceMembers.status, "active"),
        ),
      );
    if (others.length > 0) {
      throw new Error(DELETE_HAS_TEAM);
    }
    const flying = await db
      .select({ id: productionJobs.id })
      .from(productionJobs)
      .where(
        and(
          eq(productionJobs.workspaceId, studio.id),
          inArray(productionJobs.status, IN_FLIGHT_JOB_STATUSES),
        ),
      )
      .limit(1);
    if (flying.length > 0) {
      throw new Error(DELETE_IN_FLIGHT);
    }
  }
}

async function scheduleWorkspaceMedia(db: Db, workspaceId: string, enqueueCleanup: DeleteAccountDeps["enqueueCleanup"]) {
  const now = new Date();
  const rows = await db
    .select({ id: assets.id, objectKey: assets.r2ObjectKey })
    .from(assets)
    .where(and(eq(assets.workspaceId, workspaceId), isNull(assets.deletedAt)));
  for (const row of rows) {
    await db
      .update(assets)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(assets.id, row.id));
    await enqueueCleanup(workspaceId, row.objectKey);
  }
  await db
    .update(projects)
    .set({ deletedAt: now, updatedAt: now })
    .where(and(eq(projects.workspaceId, workspaceId), isNull(projects.deletedAt)));
}

export async function deleteAccount(
  db: Db,
  input: { userId: string; confirmation: string; password?: string },
  deps: DeleteAccountDeps,
) {
  if (input.confirmation.trim() !== DELETE_CONFIRMATION) {
    throw new Error(DELETE_CONFIRM_HINT);
  }
  if (deps.hasPassword) {
    const ok = input.password ? await deps.verifyPassword?.(input.password) : false;
    if (!ok) {
      throw new Error(DELETE_PASSWORD_WRONG);
    }
  }

  await assertSafeToDelete(db, input.userId);

  const memberships = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, input.userId));
  for (const membership of memberships) {
    const identity = await getOrCreateIdentity(db, membership.workspaceId, input.userId);
    const keys = await scheduleIdentityDelete(db, identity.id, "all");
    for (const key of keys) {
      await deps.enqueueCleanup(membership.workspaceId, key);
    }
  }

  const owned = await ownedWorkspaces(db, input.userId);
  for (const studio of owned) {
    await deps.cancelOwnedSubscription(studio.id);
    await scheduleWorkspaceMedia(db, studio.id, deps.enqueueCleanup);
    const now = new Date();
    await db
      .update(workspaces)
      .set({ status: "deleted", updatedAt: now })
      .where(eq(workspaces.id, studio.id));
  }

  for (const membership of memberships) {
    await db.delete(workspaceMembers).where(eq(workspaceMembers.id, membership.id));
  }

  const [person] = await db.select({ email: user.email }).from(user).where(eq(user.id, input.userId)).limit(1);
  const now = new Date();
  await db.delete(session).where(eq(session.userId, input.userId));
  await db
    .update(account)
    .set({ password: null, accessToken: null, refreshToken: null, idToken: null, updatedAt: now })
    .where(eq(account.userId, input.userId));
  if (person?.email) {
    await db.delete(verification).where(eq(verification.identifier, person.email));
  }
  await db
    .update(user)
    .set({
      email: closedAccountEmail(input.userId),
      name: "Deleted account",
      firstName: "Deleted",
      lastName: "account",
      image: null,
      emailVerified: false,
      updatedAt: now,
    })
    .where(eq(user.id, input.userId));
  await db
    .update(profiles)
    .set({
      firstName: "Deleted",
      lastName: "account",
      deletedAt: now,
      updatedAt: now,
    })
    .where(eq(profiles.userId, input.userId));
  await db.insert(auditLogs).values({
    id: newId(),
    actorUserId: input.userId,
    action: "account.deleted",
    targetType: "user",
    targetId: input.userId,
    metadataJson: JSON.stringify({ retainedPayments: true }),
    createdAt: now,
  });

  await deps.revokeSessions();
}

export async function paymentRecordsForWorkspace(db: Db, workspaceId: string) {
  return db
    .select({
      id: payments.id,
      amountMinor: payments.amountMinor,
      currency: payments.currency,
      status: payments.status,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(eq(payments.workspaceId, workspaceId));
}
