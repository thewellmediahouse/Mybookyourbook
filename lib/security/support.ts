import { desc, eq, inArray } from "drizzle-orm";
import { parseAdminEmails } from "@/lib/authz/admin";
import { getAuthBaseUrl } from "@/lib/auth/env";
import { normalizeEmail } from "@/lib/auth/password";
import type { Db } from "@/lib/db/client";
import { supportReplies, supportTickets, user, workspaces } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { notifySupportReply, notifySupportTicketCreated, type SupportMailSink } from "@/lib/notifications/notify";
import type { NotificationEnv } from "@/lib/notifications/queue";
import { SUPPORT_CATEGORIES, SUPPORT_REPLY_HINT } from "./copy";
import { assertRateLimit } from "./rate-limit";

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export type { SupportMailSink };

export function parseSupportCategory(value: string): SupportCategory | null {
  return (SUPPORT_CATEGORIES as readonly string[]).includes(value) ? (value as SupportCategory) : null;
}

export function parseContactEmail(value: string): string | null {
  const email = normalizeEmail(value);
  if (email.length < 5 || email.length > 254) {
    return null;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return null;
  }
  return email;
}

export function supportMailSinkFromEnv(env: NotificationEnv & {
  ADMIN_EMAILS?: string;
  BETTER_AUTH_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
}): SupportMailSink {
  return {
    appUrl: getAuthBaseUrl(env),
    env,
    staffEmails: parseAdminEmails("ADMIN_EMAILS" in env ? String(env.ADMIN_EMAILS ?? "") : ""),
  };
}

function trimTicketFields(input: { subject: string; message: string }) {
  const subject = input.subject.trim();
  const message = input.message.trim();
  if (subject.length < 3) {
    throw new Error("Enter a short subject.");
  }
  if (subject.length > 120) {
    throw new Error("Keep the subject under 120 characters.");
  }
  if (message.length < 10) {
    throw new Error("Tell us a little more so we can help.");
  }
  if (message.length > 4000) {
    throw new Error("Keep the message under 4,000 characters.");
  }
  return { subject, message };
}

function trimReplyBody(value: string) {
  const body = value.trim();
  if (body.length < 10) {
    throw new Error(SUPPORT_REPLY_HINT);
  }
  if (body.length > 4000) {
    throw new Error("Keep the reply under 4,000 characters.");
  }
  return body;
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
    contactEmail?: string | null;
    contactName?: string | null;
  },
  sink?: SupportMailSink,
) {
  const { subject, message } = trimTicketFields(input);
  await assertRateLimit(db, "support", input.userId);
  const now = new Date();
  const id = newId();
  await db.insert(supportTickets).values({
    id,
    userId: input.userId,
    workspaceId: input.workspaceId,
    projectId: input.projectId || null,
    contactEmail: input.contactEmail?.trim() || null,
    contactName: input.contactName?.trim() || null,
    category: input.category,
    subject,
    message,
    status: "OPEN",
    createdAt: now,
    updatedAt: now,
  });
  const ticket = {
    id,
    category: input.category,
    subject,
    message,
    userId: input.userId,
    workspaceId: input.workspaceId,
    contactEmail: input.contactEmail?.trim() || null,
    contactName: input.contactName?.trim() || null,
  };
  if (sink) {
    await notifySupportTicketCreated(db, ticket, sink);
  }
  return ticket;
}

export async function createPublicSupportTicket(
  db: Db,
  input: {
    category: SupportCategory;
    subject: string;
    message: string;
    contactEmail: string;
    contactName?: string | null;
  },
  sink?: SupportMailSink,
) {
  const contactEmail = parseContactEmail(input.contactEmail);
  if (!contactEmail) {
    throw new Error("Enter a valid email so we can reply.");
  }
  const { subject, message } = trimTicketFields(input);
  const contactName = input.contactName?.trim() || null;
  if (contactName && contactName.length > 80) {
    throw new Error("Keep your name under 80 characters.");
  }
  await assertRateLimit(db, "support", contactEmail);
  const now = new Date();
  const id = newId();
  await db.insert(supportTickets).values({
    id,
    userId: null,
    workspaceId: null,
    projectId: null,
    contactEmail,
    contactName,
    category: input.category,
    subject,
    message,
    status: "OPEN",
    createdAt: now,
    updatedAt: now,
  });
  const ticket = {
    id,
    category: input.category,
    subject,
    message,
    userId: null,
    workspaceId: null,
    contactEmail,
    contactName,
  };
  if (sink) {
    await notifySupportTicketCreated(db, ticket, sink);
  }
  return ticket;
}

export async function listWorkspaceSupportThreads(db: Db, workspaceId: string) {
  const tickets = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.workspaceId, workspaceId))
    .orderBy(desc(supportTickets.createdAt))
    .limit(40);
  if (tickets.length === 0) {
    return [];
  }
  const replies = await db
    .select()
    .from(supportReplies)
    .where(
      inArray(
        supportReplies.ticketId,
        tickets.map((row) => row.id),
      ),
    )
    .orderBy(supportReplies.createdAt);
  return tickets.map((ticket) => ({
    ...ticket,
    replies: replies.filter((reply) => reply.ticketId === ticket.id),
  }));
}

export async function getSupportTicket(db: Db, ticketId: string) {
  const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, ticketId)).limit(1);
  return ticket ?? null;
}

export async function listSupportReplies(db: Db, ticketId: string) {
  return db.select().from(supportReplies).where(eq(supportReplies.ticketId, ticketId)).orderBy(supportReplies.createdAt);
}

export async function addSupportReply(
  db: Db,
  input: {
    ticketId: string;
    authorUserId: string;
    authorRole: "customer" | "staff";
    body: string;
    workspaceId?: string;
  },
  sink?: SupportMailSink,
) {
  const ticket = await getSupportTicket(db, input.ticketId);
  if (!ticket) {
    throw new Error("That message was not found.");
  }
  if (ticket.status === "CLOSED") {
    throw new Error("This conversation is closed.");
  }
  if (input.authorRole === "customer") {
    if (!ticket.workspaceId || ticket.workspaceId !== input.workspaceId) {
      throw new Error("That message was not found.");
    }
    await assertRateLimit(db, "support", input.authorUserId);
  }
  const body = trimReplyBody(input.body);
  const now = new Date();
  const id = newId();
  await db.insert(supportReplies).values({
    id,
    ticketId: ticket.id,
    authorUserId: input.authorUserId,
    authorRole: input.authorRole,
    body,
    createdAt: now,
  });
  const nextStatus =
    input.authorRole === "staff" && ticket.status === "OPEN"
      ? "IN_PROGRESS"
      : input.authorRole === "customer" && ticket.status === "RESOLVED"
        ? "OPEN"
        : ticket.status;
  if (nextStatus !== ticket.status) {
    await db
      .update(supportTickets)
      .set({ status: nextStatus, updatedAt: now })
      .where(eq(supportTickets.id, ticket.id));
  } else {
    await db.update(supportTickets).set({ updatedAt: now }).where(eq(supportTickets.id, ticket.id));
  }
  if (sink) {
    await notifySupportReply(
      db,
      {
        ticket,
        replyId: id,
        authorRole: input.authorRole,
        body,
      },
      sink,
    );
  }
  return { id, ticketId: ticket.id, status: nextStatus };
}

export async function loadTicketContact(db: Db, ticket: {
  userId: string | null;
  workspaceId: string | null;
  contactEmail: string | null;
  contactName: string | null;
}) {
  let email = ticket.contactEmail;
  let name = ticket.contactName;
  let studioName: string | null = null;
  if (ticket.userId) {
    const [person] = await db
      .select({ email: user.email, name: user.name, firstName: user.firstName })
      .from(user)
      .where(eq(user.id, ticket.userId))
      .limit(1);
    email = email || person?.email || null;
    name = name || person?.firstName || person?.name || null;
  }
  if (ticket.workspaceId) {
    const [studio] = await db
      .select({ name: workspaces.name })
      .from(workspaces)
      .where(eq(workspaces.id, ticket.workspaceId))
      .limit(1);
    studioName = studio?.name ?? null;
  }
  return { email, name, studioName };
}

export function isAbuseReport(category: SupportCategory) {
  return category === "Abuse";
}

export function canCustomerReply(status: string) {
  return status === "OPEN" || status === "IN_PROGRESS" || status === "RESOLVED";
}
