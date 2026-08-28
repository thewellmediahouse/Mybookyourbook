import { eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { subscriptions } from "@/lib/db/schema";
import { PaymentError } from "@/lib/providers/payments";
import type { PaymentProvider, PaymentsAdapter } from "@/lib/providers/payments";
import { CHECKOUT_CANCEL_NEEDS_PROVIDER, CHECKOUT_NO_SUBSCRIPTION } from "./copy";
import { unpackCustomer } from "./fulfill";
import { getActiveSubscription } from "./queries";

export async function cancelWorkspaceSubscription(
  db: Db,
  input: {
    workspaceId: string;
    provider: PaymentProvider;
    adapter: PaymentsAdapter;
  },
) {
  const subscription = await getActiveSubscription(db, input.workspaceId);
  if (!subscription) {
    throw new PaymentError("NO_SUBSCRIPTION", CHECKOUT_NO_SUBSCRIPTION);
  }
  const packed = unpackCustomer(subscription.providerCustomerId);
  if (input.adapter === "payfast" || input.adapter === "payoneer" || input.adapter === "rapyd") {
    throw new PaymentError("NO_SUBSCRIPTION", CHECKOUT_CANCEL_NEEDS_PROVIDER);
  }
  await input.provider.cancelSubscription({
    providerSubscriptionId: subscription.providerSubscriptionId ?? subscription.id,
    emailToken: packed.emailToken ?? "mock_email_token",
  });
  const now = new Date();
  await db
    .update(subscriptions)
    .set({
      cancelAtPeriodEnd: true,
      updatedAt: now,
    })
    .where(eq(subscriptions.id, subscription.id));
  return { cancelAtPeriodEnd: true, periodEnd: subscription.periodEnd };
}
