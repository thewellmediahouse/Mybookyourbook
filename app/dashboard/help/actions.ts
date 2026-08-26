"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";
import { requireStudio } from "@/lib/dashboard/studio";
import { SUPPORT_REPLY_SENT, SUPPORT_SENT } from "@/lib/security/copy";
import {
  addSupportReply,
  createSupportTicket,
  parseSupportCategory,
  supportMailSinkFromEnv,
} from "@/lib/security/support";

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
    const { env } = await getCloudflareContext({ async: true });
    await createSupportTicket(
      studio.db,
      {
        userId: studio.userId,
        workspaceId: studio.active.workspaceId,
        category,
        subject: String(formData.get("subject") ?? ""),
        message: String(formData.get("message") ?? ""),
        projectId: String(formData.get("projectId") ?? "") || null,
        contactEmail: studio.email,
        contactName: [studio.firstName, studio.lastName].filter(Boolean).join(" ") || null,
      },
      supportMailSinkFromEnv(env),
    );
    revalidatePath("/dashboard/help");
    return { message: SUPPORT_SENT };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "We couldn't send that message." };
  }
}

export async function replyToSupportMessage(
  _prev: SupportActionState,
  formData: FormData,
): Promise<SupportActionState> {
  const studio = await requireStudio();
  try {
    const { env } = await getCloudflareContext({ async: true });
    await addSupportReply(
      studio.db,
      {
        ticketId: String(formData.get("ticketId") ?? ""),
        authorUserId: studio.userId,
        authorRole: "customer",
        body: String(formData.get("body") ?? ""),
        workspaceId: studio.active.workspaceId,
      },
      supportMailSinkFromEnv(env),
    );
    revalidatePath("/dashboard/help");
    return { message: SUPPORT_REPLY_SENT };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "We couldn't send that message." };
  }
}
