import { eq } from "drizzle-orm";
import type { WorkspaceType } from "@/lib/authz/roles";
import type { Db } from "@/lib/db/client";
import {
  auditLogs,
  businesses,
  creditWallets,
  profiles,
  workspaceMembers,
  workspaces,
} from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { billingForCountry } from "./billing-country";
import { uniqueSlug } from "./slug";

export type CreateWorkspaceInput = {
  ownerUserId: string;
  name: string;
  type: WorkspaceType;
  country: string;
  business: {
    name: string;
    website?: string;
    industry?: string;
    city?: string;
    description?: string;
    tagline?: string;
    phone?: string;
    email?: string;
    whatsapp?: string;
    primaryColor?: string;
    secondaryColor?: string;
    defaultCta?: string;
    defaultLogoPosition?: string;
    timezone?: string;
  };
};

export async function createWorkspaceForOwner(db: Db, input: CreateWorkspaceInput) {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Enter a studio name.");
  }
  const businessName = input.business.name.trim() || name;
  const billing = billingForCountry(input.country);
  const now = new Date();
  const workspaceId = newId();
  const memberId = newId();
  const businessId = newId();

  await db.insert(workspaces).values({
    id: workspaceId,
    name,
    slug: uniqueSlug(name),
    type: input.type,
    ownerUserId: input.ownerUserId,
    country: billing.country,
    billingCurrency: billing.billingCurrency,
    status: "active",
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(creditWallets).values({
    workspaceId,
    balance: 0,
    updatedAt: now,
  });

  await db.insert(workspaceMembers).values({
    id: memberId,
    workspaceId,
    userId: input.ownerUserId,
    role: "OWNER",
    status: "active",
    invitedBy: null,
    joinedAt: now,
    createdAt: now,
  });

  await db.insert(businesses).values({
    id: businessId,
    workspaceId,
    name: businessName,
    website: emptyToNull(input.business.website),
    industry: emptyToNull(input.business.industry),
    country: billing.country,
    city: emptyToNull(input.business.city),
    description: emptyToNull(input.business.description),
    tagline: emptyToNull(input.business.tagline),
    phone: emptyToNull(input.business.phone),
    email: emptyToNull(input.business.email),
    whatsapp: emptyToNull(input.business.whatsapp),
    primaryColor: emptyToNull(input.business.primaryColor),
    secondaryColor: emptyToNull(input.business.secondaryColor),
    defaultCta: emptyToNull(input.business.defaultCta),
    defaultLogoPosition: emptyToNull(input.business.defaultLogoPosition) ?? "bottom-right",
    timezone: emptyToNull(input.business.timezone),
    createdAt: now,
    updatedAt: now,
  });

  await db
    .update(profiles)
    .set({ country: billing.country, updatedAt: now })
    .where(eq(profiles.userId, input.ownerUserId));

  await db.insert(auditLogs).values({
    id: newId(),
    actorUserId: input.ownerUserId,
    workspaceId,
    action: "workspace.created",
    targetType: "workspace",
    targetId: workspaceId,
    metadataJson: JSON.stringify({ type: input.type, country: billing.country }),
    createdAt: now,
  });

  return { workspaceId, businessId, memberId };
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
