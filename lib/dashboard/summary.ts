import { and, count, desc, eq, inArray, isNull, ne } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import {
  assets,
  businesses,
  creditTransactions,
  creditWallets,
  notifications,
  presenterIdentities,
  productionJobs,
  projects,
  user,
  workspaceMembers,
} from "@/lib/db/schema";
import { pickPlayableVideoAssetId } from "@/lib/api/byte-range";
import { IN_PRODUCTION_STATUSES } from "@/lib/projects/status";
import { asCount } from "./format";

export type DashboardSummary = {
  credits: number;
  commercialsCompleted: number;
  inProduction: number;
  ready: number;
  projectCount: number;
};

export type CommercialListItem = {
  id: string;
  title: string;
  status: string;
  duration: number;
  aspectRatio: string | null;
  platform: string | null;
  updatedAt: Date;
  businessName: string;
  thumbnailAssetId: string | null;
  jobStatus: string | null;
  finalAssetId: string | null;
};

export async function getDashboardSummary(db: Db, workspaceId: string): Promise<DashboardSummary> {
  const [wallet] = await db
    .select({ balance: creditWallets.balance })
    .from(creditWallets)
    .where(eq(creditWallets.workspaceId, workspaceId))
    .limit(1);

  const [completed] = await db
    .select({ value: count() })
    .from(projects)
    .where(
      and(eq(projects.workspaceId, workspaceId), eq(projects.status, "READY"), isNull(projects.deletedAt)),
    );

  const [active] = await db
    .select({ value: count() })
    .from(projects)
    .where(
      and(
        eq(projects.workspaceId, workspaceId),
        inArray(projects.status, IN_PRODUCTION_STATUSES),
        isNull(projects.deletedAt),
      ),
    );

  const [all] = await db
    .select({ value: count() })
    .from(projects)
    .where(and(eq(projects.workspaceId, workspaceId), isNull(projects.deletedAt)));

  const readyCount = asCount(completed?.value);
  return {
    credits: wallet?.balance ?? 0,
    commercialsCompleted: readyCount,
    inProduction: asCount(active?.value),
    ready: readyCount,
    projectCount: asCount(all?.value),
  };
}

export async function listCommercials(
  db: Db,
  workspaceId: string,
  limit = 50,
): Promise<CommercialListItem[]> {
  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      status: projects.status,
      duration: projects.duration,
      aspectRatio: projects.aspectRatio,
      platform: projects.platform,
      updatedAt: projects.updatedAt,
      businessName: businesses.name,
    })
    .from(projects)
    .innerJoin(businesses, eq(projects.businessId, businesses.id))
    .where(and(eq(projects.workspaceId, workspaceId), isNull(projects.deletedAt)))
    .orderBy(desc(projects.updatedAt))
    .limit(limit);
  const projectIds = rows.map((row) => row.id);
  const thumbs = await thumbnailIdsForProjects(db, projectIds);
  const jobs = await jobsForProjects(db, projectIds);
  return rows.map((row) => {
    const projectJobs = jobs.get(row.id) ?? [];
    return {
      ...row,
      thumbnailAssetId: thumbs.get(row.id) ?? null,
      jobStatus: projectJobs[0]?.status ?? null,
      finalAssetId: pickPlayableVideoAssetId(projectJobs),
    };
  });
}

async function jobsForProjects(db: Db, projectIds: string[]) {
  const map = new Map<string, Array<{ status: string; finalAssetId: string | null; sourceAssetId: string | null }>>();
  if (projectIds.length === 0) {
    return map;
  }
  const rows = await db
    .select({
      projectId: productionJobs.projectId,
      status: productionJobs.status,
      finalAssetId: productionJobs.finalAssetId,
      sourceAssetId: productionJobs.sourceAssetId,
      createdAt: productionJobs.createdAt,
    })
    .from(productionJobs)
    .where(inArray(productionJobs.projectId, projectIds))
    .orderBy(desc(productionJobs.createdAt));
  for (const row of rows) {
    const list = map.get(row.projectId) ?? [];
    list.push({
      status: row.status,
      finalAssetId: row.finalAssetId,
      sourceAssetId: row.sourceAssetId,
    });
    map.set(row.projectId, list);
  }
  return map;
}

async function thumbnailIdsForProjects(db: Db, projectIds: string[]) {
  const map = new Map<string, string>();
  if (projectIds.length === 0) {
    return map;
  }
  const rows = await db
    .select({
      id: assets.id,
      projectId: assets.projectId,
    })
    .from(assets)
    .where(
      and(
        inArray(assets.projectId, projectIds),
        eq(assets.role, "thumbnail"),
        isNull(assets.deletedAt),
      ),
    )
    .orderBy(desc(assets.createdAt));
  for (const row of rows) {
    if (row.projectId && !map.has(row.projectId)) {
      map.set(row.projectId, row.id);
    }
  }
  return map;
}

export async function getProjectThumbnailAssetId(db: Db, projectId: string): Promise<string | null> {
  const thumbs = await thumbnailIdsForProjects(db, [projectId]);
  return thumbs.get(projectId) ?? null;
}

export async function getUnreadNotificationCount(
  db: Db,
  userId: string,
  workspaceId: string,
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.workspaceId, workspaceId),
        isNull(notifications.readAt),
      ),
    );
  return asCount(row?.value);
}

export async function listWorkspaceNotifications(db: Db, userId: string, workspaceId: string) {
  return db
    .select({
      id: notifications.id,
      title: notifications.title,
      body: notifications.body,
      actionUrl: notifications.actionUrl,
      createdAt: notifications.createdAt,
      readAt: notifications.readAt,
    })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.workspaceId, workspaceId)))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function listTeamMembers(db: Db, workspaceId: string) {
  return db
    .select({
      id: workspaceMembers.id,
      userId: workspaceMembers.userId,
      name: user.name,
      email: user.email,
      role: workspaceMembers.role,
      status: workspaceMembers.status,
      joinedAt: workspaceMembers.joinedAt,
    })
    .from(workspaceMembers)
    .innerJoin(user, eq(workspaceMembers.userId, user.id))
    .where(eq(workspaceMembers.workspaceId, workspaceId))
    .orderBy(desc(workspaceMembers.createdAt));
}

export async function listMediaAssets(db: Db, workspaceId: string) {
  return db
    .select({
      id: assets.id,
      category: assets.category,
      role: assets.role,
      mimeType: assets.mimeType,
      createdAt: assets.createdAt,
    })
    .from(assets)
    .where(
      and(eq(assets.workspaceId, workspaceId), isNull(assets.deletedAt), ne(assets.category, "identity")),
    )
    .orderBy(desc(assets.createdAt))
    .limit(50);
}

export async function getPresenterIdentity(db: Db, workspaceId: string, userId: string) {
  const [row] = await db
    .select({
      id: presenterIdentities.id,
      status: presenterIdentities.status,
      createdAt: presenterIdentities.createdAt,
      updatedAt: presenterIdentities.updatedAt,
    })
    .from(presenterIdentities)
    .where(
      and(eq(presenterIdentities.workspaceId, workspaceId), eq(presenterIdentities.userId, userId)),
    )
    .limit(1);
  return row ?? null;
}

export async function listCreditHistory(db: Db, workspaceId: string) {
  return db
    .select({
      id: creditTransactions.id,
      amount: creditTransactions.amount,
      type: creditTransactions.type,
      description: creditTransactions.description,
      createdAt: creditTransactions.createdAt,
    })
    .from(creditTransactions)
    .where(eq(creditTransactions.workspaceId, workspaceId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(50);
}
