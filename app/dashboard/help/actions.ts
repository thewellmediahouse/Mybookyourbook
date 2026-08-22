"use server";

import { requireStudio } from "@/lib/dashboard/studio";
import { SUPPORT_SENT } from "@/lib/security/copy";
import { createSupportTicket, parseSupportCategory } from "@/lib/security/support";

export type SupportActionState = { error?: string; message?: string };

export async function sendSupportMessage(
  _prev: SupportActionState,
  formData: FormData,
): Promise<SupportActionState> {
  const studio = await requireStudio();
  const category = parseSupportCategory(String(formData.get("category") ?? ""));
  if (!category) {
    return { error: "Choose a category." };
  }
  try {
    await createSupportTicket(studio.db, {
      userId: studio.userId,
      workspaceId: studio.active.workspaceId,
      category,
      subject: String(formData.get("subject") ?? ""),
      message: String(formData.get("message") ?? ""),
      projectId: String(formData.get("projectId") ?? "") || null,
    });
    return { message: SUPPORT_SENT };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "We couldn't send that message." };
  }
}
