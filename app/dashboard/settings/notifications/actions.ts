"use server";

import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";

export type NotificationPrefState = { error?: string; message?: string };

export async function updateNotificationPreferences(
  _prev: NotificationPrefState,
  formData: FormData,
): Promise<NotificationPrefState> {
  const session = await requireUser();
  const productUpdates = formData.get("productUpdates") === "on";
  const db = await getDb();
  await db
    .update(profiles)
    .set({ emailProductUpdates: productUpdates, updatedAt: new Date() })
    .where(eq(profiles.userId, session.user.id));
  return { message: "Preferences saved." };
}
