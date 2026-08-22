import { and, eq, isNull } from "drizzle-orm";
import { isUniqueConflict } from "@/lib/credits/errors";
import type { Db } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";
import { newId } from "@/lib/id";

export async function insertNotification(
  db: Db,
  input: {
    userId: string;
    workspaceId: string;
    type: string;
    title: string;
    body: string;
    actionUrl?: string;
    eventKey: string;
  },
): Promise<"inserted" | "duplicate"> {
  try {
    await db.insert(notifications).values({
      id: newId(),
      userId: input.userId,
      workspaceId: input.workspaceId,
      type: input.type,
      title: input.title,
      body: input.body,
      actionUrl: input.actionUrl ?? null,
      eventKey: input.eventKey,
      createdAt: new Date(),
    });
    return "inserted";
  } catch (error) {
    if (isUniqueConflict(error)) {
      return "duplicate";
    }
    throw error;
  }
}

export async function markWorkspaceNotificationsRead(db: Db, userId: string, workspaceId: string) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.workspaceId, workspaceId),
        isNull(notifications.readAt),
      ),
    );
}
