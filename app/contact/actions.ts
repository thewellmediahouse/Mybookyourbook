"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SUPPORT_SENT } from "@/lib/security/copy";
import { createPublicSupportTicket, parseSupportCategory, supportMailSinkFromEnv } from "@/lib/security/support";
import { getDb } from "@/lib/db/client";

export type ContactActionState = { error?: string; message?: string };

export async function sendPublicContactMessage(
  _prev: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const category = parseSupportCategory(String(formData.get("category") ?? ""));
  if (!category) {
    return { error: "Choose a category." };
  }
  try {
    const db = await getDb();
    const { env } = await getCloudflareContext({ async: true });
    await createPublicSupportTicket(
      db,
      {
        category,
        subject: String(formData.get("subject") ?? ""),
        message: String(formData.get("message") ?? ""),
        contactEmail: String(formData.get("email") ?? ""),
        contactName: String(formData.get("name") ?? ""),
      },
      supportMailSinkFromEnv(env),
    );
    return { message: SUPPORT_SENT };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "We couldn't send that message." };
  }
}
