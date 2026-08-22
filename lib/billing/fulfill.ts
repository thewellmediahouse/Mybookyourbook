import { and, eq } from "drizzle-orm";
import { grantCredits } from "@/lib/credits/ledger";
import type { Db } from "@/lib/db/client";
import {
  auditLogs,
  paymentEvents,
  payments,
  subscriptions,
  workspaces,
} from "@/lib/db/schema";
import { isUniqueConflict } from "@/lib/credits/errors";
import { newId } from "@/lib/id";
import { PaymentError } from "@/lib/providers/payments";
import {
  PAYMENT_SUCCESS_TITLE,
  SUBSCRIPTION_UPDATED_TITLE,
  paymentSuccessBody,
  purchaseIdempotencyKey,
} from "./copy";
import { getPaymentByReference } from "./queries";
import { getPlanById, isPurchasablePlan } from "./plans";
import { notifyPaymentReceipt } from "@/lib/notifications/notify";
import { getAuthBaseUrl } from "@/lib/auth/env";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export type ChargeSnapshot = {
  provider: string;
  eventId: string;
  eventType: string;
  reference: string;
  amountMinor: number;
  currency: string;
  status: "success";
  metadata: {
    workspaceId?: string;
    planId?: string;
    paymentId?: string;
  };
  last4?: string;
  brand?: string;
  subscription?: {
    providerSubscriptionId: string;
    providerCustomerId?: string;
    emailToken?: string;
    periodStart?: Date;
    periodEnd?: Date;
  };
  payloadJson?: string;
};

export type FulfillResult = {
  granted: boolean;
  alreadyProcessed: boolean;
  reason?: "amount" | "currency" | "plan" | "workspace" | "duplicate";
  credits?: number;
  paymentId?: string;
};

function monthFromNow(now: Date): Date {
  const next = new Date(now);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return next;
}

function packCustomer(customerId: string | undefined, emailToken: string | undefined): string | null {
  if (!customerId && !emailToken) {
    return null;
  }
  if (customerId && emailToken) {
    return `${customerId}|${emailToken}`;
  }
  return customerId ?? null;
}

export function unpackCustomer(value: string | null): { customerId?: string; emailToken?: string } {
  if (!value) {
    return {};
  }
  const [customerId, emailToken] = value.split("|");
  return {
    customerId: customerId || undefined,
    emailToken: emailToken || undefined,
  };
}

async function recordEvent(
  db: Db,
  input: {
    provider: string;
    eventId: string;
    paymentId: string | null;
    type: string;
    payloadJson?: string;
  },
): Promise<{ inserted: boolean }> {
  const now = new Date();
  try {
    await db.insert(paymentEvents).values({
      id: newId(),
      provider: input.provider,
      providerEventId: input.eventId,
      paymentId: input.paymentId,
      type: input.type,
      payloadJson: input.payloadJson ?? null,
      processedAt: now,
      createdAt: now,
    });
    return { inserted: true };
  } catch (error) {
    if (isUniqueConflict(error)) {
      return { inserted: false };
    }
    throw error;
  }
}

async function billingNoticeSink() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return { appUrl: getAuthBaseUrl(env), env };
  } catch {
    return { appUrl: "http://localhost:3000" };
  }
}

async function eventAlreadyProcessed(db: Db, provider: string, eventId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: paymentEvents.id })
    .from(paymentEvents)
    .where(and(eq(paymentEvents.provider, provider), eq(paymentEvents.providerEventId, eventId)))
    .limit(1);
  return Boolean(row);
}

async function rejectPayment(
  db: Db,
  snapshot: ChargeSnapshot,
  paymentId: string | undefined,
  reason: FulfillResult["reason"],
): Promise<FulfillResult> {
  if (paymentId) {
    await db
      .update(payments)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(payments.id, paymentId));
  }
  await recordEvent(db, {
    provider: snapshot.provider,
    eventId: snapshot.eventId,
    paymentId: paymentId ?? null,
    type: snapshot.eventType,
    payloadJson: snapshot.payloadJson,
  });
  return { granted: false, alreadyProcessed: false, reason, paymentId };
}

function paymentMeta(plan: {
  id: string;
  name: string;
  code: string;
  credits: number;
  interval: string;
}, workspaceId: string, snapshot: ChargeSnapshot) {
  return JSON.stringify({
    planId: plan.id,
    planName: plan.name,
    planCode: plan.code,
    credits: plan.credits,
    interval: plan.interval,
    workspaceId,
    last4: snapshot.last4,
    brand: snapshot.brand,
  });
}

/**
 * Grant credits only from a verified provider snapshot.
 * Redirect query parameters must never call this.
 */
export async function fulfillVerifiedCharge(db: Db, snapshot: ChargeSnapshot): Promise<FulfillResult> {
  if (await eventAlreadyProcessed(db, snapshot.provider, snapshot.eventId)) {
    return { granted: false, alreadyProcessed: true, reason: "duplicate" };
  }

  const payment = await getPaymentByReference(db, snapshot.provider, snapshot.reference);
  const planId = snapshot.metadata.planId;
  if (!planId) {
    return rejectPayment(db, snapshot, payment?.id, "plan");
  }

  const plan = await getPlanById(db, planId);
  if (!plan || !isPurchasablePlan(plan)) {
    return rejectPayment(db, snapshot, payment?.id, "plan");
  }

  const workspaceId = payment?.workspaceId ?? snapshot.metadata.workspaceId;
  if (!workspaceId) {
    return rejectPayment(db, snapshot, payment?.id, "workspace");
  }
  if (payment && snapshot.metadata.workspaceId && payment.workspaceId !== snapshot.metadata.workspaceId) {
    return rejectPayment(db, snapshot, payment.id, "workspace");
  }

  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  if (!workspace) {
    return rejectPayment(db, snapshot, payment?.id, "workspace");
  }
  if (workspace.billingCurrency !== plan.currency) {
    return rejectPayment(db, snapshot, payment?.id, "currency");
  }

  if (payment) {
    if (snapshot.amountMinor !== payment.amountMinor) {
      return rejectPayment(db, snapshot, payment.id, "amount");
    }
    if (snapshot.currency !== payment.currency) {
      return rejectPayment(db, snapshot, payment.id, "currency");
    }
  } else if (snapshot.amountMinor !== plan.amountMinor || snapshot.currency !== plan.currency) {
    return rejectPayment(
      db,
      snapshot,
      undefined,
      snapshot.currency !== plan.currency ? "currency" : "amount",
    );
  }

  const now = new Date();
  let paymentId = payment?.id;
  if (payment) {
    await db
      .update(payments)
      .set({
        status: "success",
        metadataJson: paymentMeta(plan, workspaceId, snapshot),
        updatedAt: now,
      })
      .where(eq(payments.id, payment.id));
  } else {
    paymentId = newId();
    try {
      await db.insert(payments).values({
        id: paymentId,
        workspaceId,
        provider: snapshot.provider,
        providerReference: snapshot.reference,
        currency: snapshot.currency,
        amountMinor: snapshot.amountMinor,
        status: "success",
        metadataJson: paymentMeta(plan, workspaceId, snapshot),
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      if (!isUniqueConflict(error)) {
        throw error;
      }
      const winner = await getPaymentByReference(db, snapshot.provider, snapshot.reference);
      paymentId = winner?.id;
    }
  }

  if (!paymentId) {
    throw new PaymentError("PROVIDER", "We couldn't record that payment.");
  }

  const grantType = plan.interval === "month" ? "SUBSCRIPTION_GRANT" : "PURCHASE";
  await grantCredits(db, {
    workspaceId,
    amount: plan.credits,
    type: grantType,
    idempotencyKey: purchaseIdempotencyKey(snapshot.provider, snapshot.reference),
    description: paymentSuccessBody(plan.credits, plan.name),
    paymentId,
  });

  await recordEvent(db, {
    provider: snapshot.provider,
    eventId: snapshot.eventId,
    paymentId,
    type: snapshot.eventType,
    payloadJson: snapshot.payloadJson,
  });


  await db
    .update(workspaces)
    .set({ planCode: plan.code, updatedAt: now })
    .where(eq(workspaces.id, workspaceId));

  if (plan.interval === "month") {
    const periodStart = snapshot.subscription?.periodStart ?? now;
    const periodEnd = snapshot.subscription?.periodEnd ?? monthFromNow(now);
    const packedCustomer = packCustomer(
      snapshot.subscription?.providerCustomerId,
      snapshot.subscription?.emailToken,
    );
    const [existingSub] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(and(eq(subscriptions.workspaceId, workspaceId), eq(subscriptions.status, "active")))
      .limit(1);
    if (existingSub) {
      await db
        .update(subscriptions)
        .set({
          planId: plan.id,
          provider: snapshot.provider,
          providerCustomerId: packedCustomer,
          providerSubscriptionId: snapshot.subscription?.providerSubscriptionId ?? null,
          status: "active",
          periodStart,
          periodEnd,
          cancelAtPeriodEnd: false,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, existingSub.id));
    } else {
      await db.insert(subscriptions).values({
        id: newId(),
        workspaceId,
        planId: plan.id,
        provider: snapshot.provider,
        providerCustomerId: packedCustomer,
        providerSubscriptionId: snapshot.subscription?.providerSubscriptionId ?? `sub_${snapshot.reference}`,
        status: "active",
        periodStart,
        periodEnd,
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  await db.insert(auditLogs).values({
    id: newId(),
    actorUserId: workspace.ownerUserId,
    workspaceId,
    action: "billing.payment_succeeded",
    targetType: "payment",
    targetId: paymentId,
    metadataJson: JSON.stringify({
      planId: plan.id,
      reference: snapshot.reference,
      credits: plan.credits,
    }),
    createdAt: now,
  });

  await notifyPaymentReceipt(
    db,
    {
      workspaceId,
      paymentId,
      title: plan.interval === "month" ? SUBSCRIPTION_UPDATED_TITLE : PAYMENT_SUCCESS_TITLE,
      body: paymentSuccessBody(plan.credits, plan.name),
    },
    await billingNoticeSink(),
  ).catch(() => undefined);

  return {
    granted: true,
    alreadyProcessed: false,
    credits: plan.credits,
    paymentId,
  };
}
