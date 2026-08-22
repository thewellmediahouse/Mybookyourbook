"use server";

import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { profiles, user } from "@/lib/db/schema";

export type ProfileActionState = { error?: string; message?: string };

export async function updateProfile(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await requireUser();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();

  if (!firstName || !lastName) {
    return { error: "Enter your first and last name." };
  }

  const now = new Date();
  const db = await getDb();
  await db
    .update(user)
    .set({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      updatedAt: now,
    })
    .where(eq(user.id, session.user.id));
  await db
    .update(profiles)
    .set({
      firstName,
      lastName,
      timezone: timezone || null,
      country: country || null,
      updatedAt: now,
    })
    .where(eq(profiles.userId, session.user.id));

  return { message: "Profile updated." };
}
