import { eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { businesses, payments, profiles, projects, user, workspaceMembers, workspaces } from "@/lib/db/schema";

export async function exportAccountData(db: Db, userId: string) {
  const [person] = await db
    .select({
      id: user.id,
      email: user.email,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      country: profiles.country,
      timezone: profiles.timezone,
    })
    .from(user)
    .innerJoin(profiles, eq(profiles.userId, user.id))
    .where(eq(user.id, userId))
    .limit(1);
  if (!person) {
    throw new Error("Account not found.");
  }

  const memberships = await db
    .select({
      workspaceId: workspaces.id,
      name: workspaces.name,
      role: workspaceMembers.role,
      status: workspaceMembers.status,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, userId));

  const studios = [];
  for (const membership of memberships) {
    const brands = await db
      .select({ id: businesses.id, name: businesses.name, website: businesses.website })
      .from(businesses)
      .where(eq(businesses.workspaceId, membership.workspaceId));
    const commercials = await db
      .select({
        id: projects.id,
        title: projects.title,
        status: projects.status,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .where(eq(projects.workspaceId, membership.workspaceId));
    const receipts =
      membership.role === "OWNER"
        ? await db
            .select({
              id: payments.id,
              amountMinor: payments.amountMinor,
              currency: payments.currency,
              status: payments.status,
              createdAt: payments.createdAt,
            })
            .from(payments)
            .where(eq(payments.workspaceId, membership.workspaceId))
        : [];
    studios.push({
      ...membership,
      brands,
      commercials,
      payments: receipts,
    });
  }

  return {
    exportedAt: new Date().toISOString(),
    profile: {
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email,
      country: person.country,
      timezone: person.timezone,
    },
    studios,
  };
}
