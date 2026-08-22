import type { Db } from "@/lib/db/client";
import { supportTickets } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { SUPPORT_CATEGORIES } from "./copy";

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export function parseSupportCategory(value: string): SupportCategory | null {
  return (SUPPORT_CATEGORIES as readonly string[]).includes(value) ? (value as SupportCategory) : null;
}

export async function createSupportTicket(
  db: Db,
  input: {
    userId: string;
    workspaceId: string;
    category: SupportCategory;
    subject: string;
    message: string;
    projectId?: string | null;
  },
) {
  const subject = input.subject.trim();
  const message = input.message.trim();
  if (subject.length < 3) {
    throw new Error("Enter a short subject.");
  }
  if (message.length < 10) {
    throw new Error("Tell us a little more so we can help.");
  }
  const now = new Date();
  const id = newId();
  await db.insert(supportTickets).values({
    id,
    userId: input.userId,
    workspaceId: input.workspaceId,
    projectId: input.projectId || null,
    category: input.category,
    subject,
    message,
    status: "OPEN",
    createdAt: now,
    updatedAt: now,
  });
  return { id, category: input.category };
}

export function isAbuseReport(category: SupportCategory) {
  return category === "Abuse";
}
