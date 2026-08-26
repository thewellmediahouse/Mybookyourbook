import { eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { payments, workspaces } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { PaymentError } from "@/lib/providers/payments";
import type { PaymentProvider } from "@/lib/providers/payments";
import {
  CHECKOUT_CUSTOM_PLAN,
  CHECKOUT_MONTHLY_UNAVAILABLE,
  CHECKOUT_REGION_MISMATCH,
} from "./copy";
import { DEFAULT_PAYFAST_USD_ZAR_RATE, settlePayfastCharge } from "./fx";
import { getPlanById, isPurchasablePlan, paystackPlanCode, regionForWorkspace } from "./plans";

export type StartCheckoutInput = {
  workspaceId: string;
  email: string;
  planId: string;
  callbackUrl: string;
  provider: PaymentProvider;
  providerName?: string;
  requireProviderPlanCode?: boolean;
  usdZarRate?: number;
};

function checkoutReference(): string {
  return `cy.${newId()}`;
}

export async function startCheckout(db: Db, input: StartCheckoutInput) {
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, input.workspaceId))
    .limit(1);
  if (!workspace) {
    throw new PaymentError("INVALID_PLAN", CHECKOUT_REGION_MISMATCH);
  }
  const plan = await getPlanById(db, input.planId);
  if (!plan || !plan.active) {
    throw new PaymentError("INVALID_PLAN", "That plan is not available.");
  }
  const region = regionForWorkspace(workspace.country, workspace.billingCurrency);
  if (plan.region !== region || plan.currency !== workspace.billingCurrency) {
    throw new PaymentError("INVALID_PLAN", CHECKOUT_REGION_MISMATCH);
  }
  if (!isPurchasablePlan(plan)) {
    throw new PaymentError("CUSTOM_PLAN", CHECKOUT_CUSTOM_PLAN);
  }

  const providerPlanCode = paystackPlanCode(plan.metadataJson);
  if (plan.interval === "month" && input.requireProviderPlanCode && !providerPlanCode) {
    throw new PaymentError("MONTHLY_UNAVAILABLE", CHECKOUT_MONTHLY_UNAVAILABLE);
  }

  const providerName = input.providerName ?? "paystack";
  const settlement =
    providerName === "payfast"
      ? settlePayfastCharge(plan, input.usdZarRate ?? DEFAULT_PAYFAST_USD_ZAR_RATE)
      : {
          currency: plan.currency,
          amountMinor: plan.amountMinor,
          catalogCurrency: plan.currency,
          catalogAmountMinor: plan.amountMinor,
          rate: null as number | null,
        };
  const reference = checkoutReference();
  const now = new Date();
  const paymentId = newId();
  await db.insert(payments).values({
    id: paymentId,
    workspaceId: workspace.id,
    provider: providerName,
    providerReference: reference,
    currency: settlement.currency,
    amountMinor: settlement.amountMinor,
    status: "pending",
    metadataJson: JSON.stringify({
      planId: plan.id,
      planName: plan.name,
      planCode: plan.code,
      credits: plan.credits,
      interval: plan.interval,
      workspaceId: workspace.id,
      catalogCurrency: settlement.catalogCurrency,
      catalogAmountMinor: settlement.catalogAmountMinor,
      usdZarRate: settlement.rate,
    }),
    createdAt: now,
    updatedAt: now,
  });

  const checkout = await input.provider.createCheckout({
    email: input.email,
    amountMinor: settlement.amountMinor,
    currency: settlement.currency,
    reference,
    callbackUrl: input.callbackUrl,
    metadata: {
      workspaceId: workspace.id,
      planId: plan.id,
      paymentId,
    },
    country: workspace.country,
    providerPlanCode: plan.interval === "month" ? providerPlanCode : undefined,
  });

  return {
    paymentId,
    reference: checkout.reference,
    authorizationUrl: checkout.authorizationUrl,
    accessCode: checkout.accessCode,
    plan,
  };
}
