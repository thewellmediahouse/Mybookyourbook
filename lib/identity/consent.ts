import { and, eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { consents, presenterIdentities } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { CONSENT_VERSION } from "./copy";

export async function getOrCreateIdentity(db: Db, workspaceId: string, userId: string) {
  const [existing] = await db
    .select()
    .from(presenterIdentities)
    .where(and(eq(presenterIdentities.workspaceId, workspaceId), eq(presenterIdentities.userId, userId)))
    .limit(1);
  if (existing) {
    return existing;
  }
  const now = new Date();
  const id = newId();
  await db.insert(presenterIdentities).values({
    id,
    workspaceId,
    userId,
    status: "incomplete",
    createdAt: now,
    updatedAt: now,
  });
  const [created] = await db.select().from(presenterIdentities).where(eq(presenterIdentities.id, id)).limit(1);
  if (!created) {
    throw new Error("We couldn't start identity setup.");
  }
  return created;
}

export async function hasCurrentConsent(db: Db, identityId: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: consents.id })
    .from(consents)
    .where(
      and(
        eq(consents.identityId, identityId),
        eq(consents.userId, userId),
        eq(consents.consentVersion, CONSENT_VERSION),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function requireCurrentConsent(db: Db, identityId: string, userId: string) {
  if (!(await hasCurrentConsent(db, identityId, userId))) {
    throw new Error("Consent is required before identity files can be saved.");
  }
}

export async function recordIdentityConsent(
  db: Db,
  input: { userId: string; workspaceId: string; identityId: string },
) {
  if (await hasCurrentConsent(db, input.identityId, input.userId)) {
    return;
  }
  const now = new Date();
  await db.insert(consents).values({
    id: newId(),
    userId: input.userId,
    workspaceId: input.workspaceId,
    identityId: input.identityId,
    consentVersion: CONSENT_VERSION,
    acceptedAt: now,
    metadata: JSON.stringify({
      likeness: true,
      processing: true,
      impersonation: true,
      adult: true,
    }),
    createdAt: now,
  });
}
