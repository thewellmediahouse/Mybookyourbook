import { and, eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { user, workspaceMembers, workspaces } from "@/lib/db/schema";
import { CUSTOMER_FAILURE, READY_BODY, READY_TITLE } from "@/lib/production/copy";
import {
  commercialFailedEventKey,
  commercialReadyEventKey,
  CREDIT_REFUNDED_BODY,
  CREDIT_REFUNDED_TITLE,
  creditRefundedEventKey,
  paymentReceiptEventKey,
  READY_EMAIL_BUTTON,
  SUPPORT_REPLY_SUBJECT,
  supportReceivedEventKey,
  supportReplyEventKey,
  supportStaffEventKey,
} from "./copy";
import { insertNotification } from "./in-app";
import type { EmailQueueMessage } from "./messages";
import { dispatchEmail, type NotificationEnv } from "./queue";

export type SideEffectSink = {
  enqueueEmail?: (message: EmailQueueMessage) => Promise<void>;
  env?: NotificationEnv;
  appUrl: string;
};

async function listActiveMembers(db: Db, workspaceId: string) {
  return db
    .select({
      userId: workspaceMembers.userId,
      email: user.email,
      firstName: user.firstName,
    })
    .from(workspaceMembers)
    .innerJoin(user, eq(workspaceMembers.userId, user.id))
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.status, "active")));
}

async function ownerContact(db: Db, workspaceId: string) {
  const [row] = await db
    .select({
      userId: workspaces.ownerUserId,
      email: user.email,
      firstName: user.firstName,
    })
    .from(workspaces)
    .innerJoin(user, eq(workspaces.ownerUserId, user.id))
    .where(eq(workspaces.id, workspaceId))
    .limit(1);
  return row ?? null;
}

async function sendEmailSafe(sink: SideEffectSink, message: EmailQueueMessage) {
  try {
    if (sink.enqueueEmail) {
      await sink.enqueueEmail(message);
      return;
    }
    await dispatchEmail(sink.env ?? {}, message);
  } catch {
    // Email is a side effect. The commercial / payment must still complete.
  }
}

export async function notifyProductionComplete(
  db: Db,
  input: {
    workspaceId: string;
    projectId: string;
    jobId: string;
    producerUserId: string;
  },
  sink: SideEffectSink,
): Promise<void> {
  try {
    const members = await listActiveMembers(db, input.workspaceId);
    const actionUrl = `/dashboard/commercials/${input.projectId}`;
    const emailRecipients = new Map<string, (typeof members)[number]>();
    const owner = await ownerContact(db, input.workspaceId);
    for (const member of members) {
      const inserted = await insertNotification(db, {
        userId: member.userId,
        workspaceId: input.workspaceId,
        type: "production_ready",
        title: READY_TITLE,
        body: READY_BODY,
        actionUrl,
        eventKey: commercialReadyEventKey(input.jobId, member.userId),
      });
      if (
        inserted === "inserted" &&
        (member.userId === input.producerUserId || (owner && member.userId === owner.userId))
      ) {
        emailRecipients.set(member.userId, member);
      }
    }
    if (owner && !emailRecipients.has(owner.userId)) {
      const ownerNotice = await insertNotification(db, {
        userId: owner.userId,
        workspaceId: input.workspaceId,
        type: "production_ready",
        title: READY_TITLE,
        body: READY_BODY,
        actionUrl,
        eventKey: commercialReadyEventKey(input.jobId, owner.userId),
      });
      if (ownerNotice === "inserted") {
        emailRecipients.set(owner.userId, owner);
      }
    }
    for (const recipient of emailRecipients.values()) {
      await sendEmailSafe(sink, {
        kind: "email",
        template: "commercial-ready",
        to: recipient.email,
        firstName: recipient.firstName ?? undefined,
        idempotencyKey: commercialReadyEventKey(input.jobId, recipient.userId),
        appUrl: sink.appUrl,
        actionUrl,
        body: READY_BODY,
        buttonLabel: READY_EMAIL_BUTTON,
      });
    }
  } catch {
    // In-app / email failure must not fail production.
  }
}

export async function notifyProductionFailed(
  db: Db,
  input: {
    workspaceId: string;
    projectId: string;
    jobId: string;
    producerUserId: string;
    refunded: boolean;
  },
  sink: SideEffectSink,
): Promise<void> {
  try {
    const members = await listActiveMembers(db, input.workspaceId);
    const actionUrl = `/dashboard/commercials/${input.projectId}/production`;
    const owner = await ownerContact(db, input.workspaceId);
    const emailRecipients = new Map<string, (typeof members)[number]>();
    for (const member of members) {
      const inserted = await insertNotification(db, {
        userId: member.userId,
        workspaceId: input.workspaceId,
        type: "production_failed",
        title: "We couldn't finish this commercial",
        body: CUSTOMER_FAILURE,
        actionUrl,
        eventKey: commercialFailedEventKey(input.jobId, member.userId),
      });
      if (input.refunded) {
        await insertNotification(db, {
          userId: member.userId,
          workspaceId: input.workspaceId,
          type: "credit_refunded",
          title: CREDIT_REFUNDED_TITLE,
          body: CREDIT_REFUNDED_BODY,
          actionUrl: "/dashboard/credits",
          eventKey: creditRefundedEventKey(input.jobId, member.userId),
        });
      }
      if (
        inserted === "inserted" &&
        (member.userId === input.producerUserId || (owner && member.userId === owner.userId))
      ) {
        emailRecipients.set(member.userId, member);
      }
    }
    for (const recipient of emailRecipients.values()) {
      await sendEmailSafe(sink, {
        kind: "email",
        template: "commercial-failed",
        to: recipient.email,
        firstName: recipient.firstName ?? undefined,
        idempotencyKey: commercialFailedEventKey(input.jobId, recipient.userId),
        appUrl: sink.appUrl,
        actionUrl,
        body: CUSTOMER_FAILURE,
      });
    }
  } catch {
    // Failure notices must not change the failed job outcome.
  }
}

export async function notifyPaymentReceipt(
  db: Db,
  input: {
    workspaceId: string;
    paymentId: string;
    title: string;
    body: string;
  },
  sink: SideEffectSink,
): Promise<void> {
  const owner = await ownerContact(db, input.workspaceId);
  if (!owner) {
    return;
  }
  const inserted = await insertNotification(db, {
    userId: owner.userId,
    workspaceId: input.workspaceId,
    type: input.title === "Subscription updated" ? "subscription_updated" : "payment_successful",
    title: input.title,
    body: input.body,
    actionUrl: "/dashboard/billing",
    eventKey: paymentReceiptEventKey(input.paymentId, owner.userId),
  });
  if (inserted !== "inserted") {
    return;
  }
  await sendEmailSafe(sink, {
    kind: "email",
    template: "payment-receipt",
    to: owner.email,
    firstName: owner.firstName ?? undefined,
    idempotencyKey: paymentReceiptEventKey(input.paymentId, owner.userId),
    appUrl: sink.appUrl,
    actionUrl: "/dashboard/billing",
    body: input.body,
  });
}

export type SupportTicketMail = {
  id: string;
  category: string;
  subject: string;
  message: string;
  userId: string | null;
  workspaceId: string | null;
  contactEmail: string | null;
  contactName: string | null;
};

export type SupportMailSink = SideEffectSink & {
  staffEmails: string[];
};

async function loadSupportContact(db: Db, ticket: SupportTicketMail) {
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

function flattenBody(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export async function notifySupportTicketCreated(
  db: Db,
  ticket: SupportTicketMail,
  sink: SupportMailSink,
): Promise<void> {
  try {
    const contact = await loadSupportContact(db, ticket);
    const fromName = contact.name?.trim() || "Someone";
    const fromEmail = contact.email?.trim() || "no email on file";
    const studio = contact.studioName ? ` Studio: ${contact.studioName}.` : "";
    const staffBody = `${fromName} (${fromEmail}) sent a ${ticket.category} message.${studio} Subject: ${ticket.subject}. ${flattenBody(ticket.message)}`;
    const customerAction = ticket.workspaceId ? "/dashboard/help" : "/contact";
    for (const staffEmail of sink.staffEmails) {
      await sendEmailSafe(sink, {
        kind: "email",
        template: "support-staff",
        to: staffEmail,
        idempotencyKey: supportStaffEventKey(ticket.id, staffEmail),
        appUrl: sink.appUrl,
        actionUrl: `/admin/support/${ticket.id}`,
        body: staffBody,
      });
    }
    if (contact.email) {
      await sendEmailSafe(sink, {
        kind: "email",
        template: "support-received",
        to: contact.email,
        firstName: contact.name ?? undefined,
        idempotencyKey: supportReceivedEventKey(ticket.id),
        appUrl: sink.appUrl,
        actionUrl: customerAction,
        body: "Thanks. We received your message. We'll email you back.",
        buttonLabel: ticket.workspaceId ? "Open Help" : "Contact us",
      });
    }
  } catch {
    // Ticket is already saved. Mail is a side effect.
  }
}

export async function notifySupportReply(
  db: Db,
  input: {
    ticket: SupportTicketMail;
    replyId: string;
    authorRole: "customer" | "staff";
    body: string;
  },
  sink: SupportMailSink,
): Promise<void> {
  try {
    const contact = await loadSupportContact(db, input.ticket);
    const replyText = flattenBody(input.body);
    if (input.authorRole === "staff") {
      if (!contact.email) {
        return;
      }
      if (input.ticket.userId && input.ticket.workspaceId) {
        await insertNotification(db, {
          userId: input.ticket.userId,
          workspaceId: input.ticket.workspaceId,
          type: "support_reply",
          title: SUPPORT_REPLY_SUBJECT,
          body: replyText,
          actionUrl: "/dashboard/help",
          eventKey: supportReplyEventKey(input.replyId, input.ticket.userId),
        });
      }
      await sendEmailSafe(sink, {
        kind: "email",
        template: "support-reply",
        to: contact.email,
        firstName: contact.name ?? undefined,
        idempotencyKey: supportReplyEventKey(input.replyId, contact.email),
        appUrl: sink.appUrl,
        actionUrl: input.ticket.workspaceId ? "/dashboard/help" : "/contact",
        body: replyText,
      });
      return;
    }
    const fromName = contact.name?.trim() || "Customer";
    const fromEmail = contact.email?.trim() || "no email on file";
    const staffBody = `${fromName} (${fromEmail}) added to ${input.ticket.subject}. ${replyText}`;
    for (const staffEmail of sink.staffEmails) {
      await sendEmailSafe(sink, {
        kind: "email",
        template: "support-staff",
        to: staffEmail,
        idempotencyKey: supportReplyEventKey(input.replyId, staffEmail),
        appUrl: sink.appUrl,
        actionUrl: `/admin/support/${input.ticket.id}`,
        body: staffBody,
      });
    }
  } catch {
    // Reply is already saved. Mail is a side effect.
  }
}
