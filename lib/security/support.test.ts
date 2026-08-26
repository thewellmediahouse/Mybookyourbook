import { test } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { createDb } from "@/lib/db/client";
import { profiles, supportReplies, supportTickets, user } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import type { EmailQueueMessage } from "@/lib/notifications/messages";
import { createWorkspaceForOwner } from "@/lib/workspaces/create";
import { SUPPORT_CATEGORIES, SUPPORT_REFUND_CATEGORY, SUPPORT_CANCEL_CATEGORY } from "./copy";
import {
  addSupportReply,
  createPublicSupportTicket,
  createSupportTicket,
  listWorkspaceSupportThreads,
  parseSupportCategory,
} from "./support";

async function insertPerson(db: ReturnType<typeof createDb>, email: string, name: string) {
  const id = newId();
  const now = new Date();
  await db.insert(user).values({
    id,
    name,
    email,
    emailVerified: true,
    firstName: name.split(" ")[0],
    lastName: name.split(" ").slice(1).join(" ") || name,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(profiles).values({
    userId: id,
    firstName: name.split(" ")[0] ?? "Test",
    lastName: name.split(" ").slice(1).join(" ") || "User",
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

test("Refund and Cancel plan are support categories", () => {
  assert.equal(parseSupportCategory("Refund"), SUPPORT_REFUND_CATEGORY);
  assert.equal(parseSupportCategory("Cancel plan"), SUPPORT_CANCEL_CATEGORY);
  assert.ok(SUPPORT_CATEGORIES.includes("Refund"));
  assert.ok(SUPPORT_CATEGORIES.includes("Cancel plan"));
});

test("new tickets email staff and the customer; replies stay on the thread", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const stamp = Date.now();
  const owner = await insertPerson(db, `ops.owner.${stamp}@cineyou.test`, "Owner Ops");
  const staff = await insertPerson(db, `ops.staff.${stamp}@cineyou.test`, "Staff Ops");
  const studio = await createWorkspaceForOwner(db, {
    ownerUserId: owner,
    name: `Ops Studio ${stamp}`,
    type: "BUSINESS",
    country: "ZA",
    business: { name: `Ops Brand ${stamp}` },
  });
  const emails: EmailQueueMessage[] = [];
  const sink = {
    appUrl: "http://localhost:3000",
    staffEmails: ["schalk@thewellmedia.com"],
    enqueueEmail: async (message: EmailQueueMessage) => {
      emails.push(message);
    },
  };

  const ticket = await createSupportTicket(
    db,
    {
      userId: owner,
      workspaceId: studio.workspaceId,
      category: "Refund",
      subject: "I want my money back",
      message: "Please return the payment for last week's credits.",
      contactEmail: `ops.owner.${stamp}@cineyou.test`,
      contactName: "Owner Ops",
    },
    sink,
  );
  assert.equal(emails.some((item) => item.template === "support-staff"), true);
  assert.equal(emails.some((item) => item.template === "support-received"), true);
  assert.ok(emails.some((item) => item.to === "schalk@thewellmedia.com"));
  assert.ok(emails.some((item) => item.to === `ops.owner.${stamp}@cineyou.test`));

  emails.length = 0;
  await addSupportReply(
    db,
    {
      ticketId: ticket.id,
      authorUserId: staff,
      authorRole: "staff",
      body: "We received this. If we return the money it will go back to the same card.",
    },
    sink,
  );
  assert.equal(emails.some((item) => item.template === "support-reply"), true);
  const [afterStaff] = await db.select().from(supportTickets).where(eq(supportTickets.id, ticket.id)).limit(1);
  assert.equal(afterStaff?.status, "IN_PROGRESS");

  emails.length = 0;
  await addSupportReply(
    db,
    {
      ticketId: ticket.id,
      authorUserId: owner,
      authorRole: "customer",
      body: "Thank you. Please go ahead with the money return.",
      workspaceId: studio.workspaceId,
    },
    sink,
  );
  assert.equal(emails.some((item) => item.template === "support-staff"), true);

  const publicTicket = await createPublicSupportTicket(
    db,
    {
      category: "Cancel plan",
      subject: "Please stop my plan",
      message: "I do not want next month to be billed.",
      contactEmail: `ops.public.${stamp}@cineyou.test`,
      contactName: "Pat Public",
    },
    sink,
  );
  const [savedPublic] = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, publicTicket.id))
    .limit(1);
  assert.equal(savedPublic?.userId, null);
  assert.equal(savedPublic?.workspaceId, null);
  assert.equal(savedPublic?.contactEmail, `ops.public.${stamp}@cineyou.test`);
  assert.equal(savedPublic?.category, "Cancel plan");

  const threads = await listWorkspaceSupportThreads(db, studio.workspaceId);
  const match = threads.find((row) => row.id === ticket.id);
  assert.ok(match);
  assert.equal(match?.replies.length, 2);
  const replyRows = await db.select().from(supportReplies).where(eq(supportReplies.ticketId, ticket.id));
  assert.equal(replyRows.length, 2);
});
