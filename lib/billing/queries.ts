import { and, desc, eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { creditWallets, payments, plans, subscriptions, workspaces } from "@/lib/db/schema";
import { formatStudioDate } from "@/lib/dashboard/format";
import {
  CARD_ON_FILE,
  NO_PAID_PLAN,
  NO_PAYMENT_METHOD,
  cardEndingLabel,
  paymentStatusLabel,
} from "./copy";
import { listWorkspaceCatalog } from "./plans";

export async function getPaymentByReference(db: Db, provider: string, reference: string) {
  const [row] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.provider, provider), eq(payments.providerReference, reference)))
    .limit(1);
  return row ?? null;
}

export async function getPaymentByProviderReference(db: Db, reference: string) {
  const [row] = await db
    .select()
    .from(payments)
    .where(eq(payments.providerReference, reference))
    .limit(1);
  return row ?? null;
}

export async function getActiveSubscription(db: Db, workspaceId: string) {
  const [row] = await db
    .select({
      id: subscriptions.id,
      planId: subscriptions.planId,
      provider: subscriptions.provider,
      providerCustomerId: subscriptions.providerCustomerId,
      providerSubscriptionId: subscriptions.providerSubscriptionId,
      status: subscriptions.status,
      periodStart: subscriptions.periodStart,
      periodEnd: subscriptions.periodEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      planName: plans.name,
      planCode: plans.code,
      planCredits: plans.credits,
      planInterval: plans.interval,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(and(eq(subscriptions.workspaceId, workspaceId), eq(subscriptions.status, "active")))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  return row ?? null;
}

function parsePaymentMeta(raw: string | null): { last4?: string; brand?: string; planName?: string } {
  if (!raw) {
    return {};
  }
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    return {
      last4: typeof value.last4 === "string" ? value.last4 : undefined,
      brand: typeof value.brand === "string" ? value.brand : undefined,
      planName: typeof value.planName === "string" ? value.planName : undefined,
    };
  } catch {
    return {};
  }
}

export async function getBillingOverview(db: Db, workspaceId: string) {
  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  if (!workspace) {
    throw new Error("Studio not found.");
  }
  const [wallet] = await db
    .select({ balance: creditWallets.balance })
    .from(creditWallets)
    .where(eq(creditWallets.workspaceId, workspaceId))
    .limit(1);
  const subscription = await getActiveSubscription(db, workspaceId);
  const catalog = await listWorkspaceCatalog(db, {
    country: workspace.country,
    billingCurrency: workspace.billingCurrency,
  });
  const history = await db
    .select({
      id: payments.id,
      amountMinor: payments.amountMinor,
      currency: payments.currency,
      status: payments.status,
      createdAt: payments.createdAt,
      metadataJson: payments.metadataJson,
    })
    .from(payments)
    .where(eq(payments.workspaceId, workspaceId))
    .orderBy(desc(payments.createdAt))
    .limit(50);

  let currentPlan = NO_PAID_PLAN;
  if (subscription) {
    currentPlan = subscription.cancelAtPeriodEnd
      ? `${subscription.planName} (cancels at period end)`
      : subscription.planName;
  } else if (workspace.planCode) {
    const match = catalog.find((plan) => plan.code === workspace.planCode);
    currentPlan = match?.name ?? workspace.planCode;
  }

  const latestPaid = history.find((row) => row.status === "success");
  const latestMeta = latestPaid ? parsePaymentMeta(latestPaid.metadataJson) : {};
  let paymentMethod = NO_PAYMENT_METHOD;
  if (latestMeta.last4) {
    paymentMethod = cardEndingLabel(latestMeta.last4);
  } else if (subscription) {
    paymentMethod = CARD_ON_FILE;
  }

  return {
    workspace,
    credits: wallet?.balance ?? 0,
    currentPlan,
    subscription,
    nextBillingDate: subscription?.periodEnd ? formatStudioDate(subscription.periodEnd) : "None",
    paymentMethod,
    catalog,
    billingHistory: history.map((row) => ({
      id: row.id,
      amountMinor: row.amountMinor,
      currency: row.currency,
      status: row.status,
      statusLabel: paymentStatusLabel(row.status),
      createdAt: row.createdAt,
      planName: parsePaymentMeta(row.metadataJson).planName,
    })),
  };
}
