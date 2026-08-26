import type { Metadata } from "next";
import Link from "next/link";
import { CancelSubscriptionButton } from "@/components/billing/cancel-button";
import { CheckoutButton } from "@/components/billing/checkout-button";
import { DisabledAction } from "@/components/dashboard/disabled-action";
import { PageIntro } from "@/components/dashboard/page-intro";
import { canManageBilling } from "@/lib/authz/roles";
import { buyCreditsHoldReason } from "@/lib/billing/availability";
import {
  CHECKOUT_CANCEL_NEEDS_PROVIDER,
  CHECKOUT_CUSTOM_PLAN,
  CHECKOUT_MONTHLY_UNAVAILABLE,
  CHECKOUT_NO_SUBSCRIPTION,
  payfastUsdChargeNote,
} from "@/lib/billing/copy";
import { parseUsdZarRate, usdToZarMinor } from "@/lib/billing/fx";
import { getPaymentsEnv, getPaymentsSetup } from "@/lib/billing/provider";
import { inspectCheckoutRedirect } from "@/lib/billing/redirect";
import { getBillingOverview } from "@/lib/billing/queries";
import { isPurchasablePlan } from "@/lib/billing/plans";
import { creditTypeLabel } from "@/lib/credits";
import { BUY_CREDITS_OWNER_ONLY, creditsAvailableLabel } from "@/lib/dashboard/copy";
import { formatStudioDate } from "@/lib/dashboard/format";
import { requireStudio } from "@/lib/dashboard/studio";
import { listCreditHistory } from "@/lib/dashboard/summary";
import { formatMoney } from "@/lib/plans/format";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; success?: string; trxref?: string; cancelled?: string }>;
}) {
  const studio = await requireStudio();
  const params = await searchParams;
  const owner = canManageBilling(studio.role);
  const [overview, history, redirectNotice, buyReason, env] = await Promise.all([
    getBillingOverview(studio.db, studio.active.workspaceId),
    listCreditHistory(studio.db, studio.active.workspaceId),
    inspectCheckoutRedirect(studio.db, params),
    buyCreditsHoldReason(studio.role),
    getPaymentsEnv(),
  ]);
  const setup = getPaymentsSetup(env);
  const usdZarRate = parseUsdZarRate(env.PAYFAST_USD_ZAR_RATE);
  const currentCredits = overview.subscription?.planCredits ?? null;
  const oneTime = overview.catalog.filter((plan) => plan.interval === "one_time");
  const monthly = overview.catalog.filter((plan) => plan.interval === "month");

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
      <PageIntro
        kicker="BILLING"
        title="Billing"
        description={
          owner
            ? "Buy credits or change your monthly plan for this studio. Credits are added after payment is confirmed."
            : "Only the studio owner can change billing."
        }
      />
      {redirectNotice.message ? (
        <p className="mt-8 rounded-lg border border-border bg-surface p-5 text-foreground">
          {redirectNotice.message}
        </p>
      ) : null}
      <dl className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-5">
          <dt className="text-sm text-muted">Current plan</dt>
          <dd className="mt-2 text-foreground">{overview.currentPlan}</dd>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <dt className="text-sm text-muted">Credits available</dt>
          <dd className="mt-2 text-foreground">{creditsAvailableLabel(overview.credits)}</dd>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <dt className="text-sm text-muted">Next billing date</dt>
          <dd className="mt-2 text-foreground">{overview.nextBillingDate}</dd>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <dt className="text-sm text-muted">Payment method</dt>
          <dd className="mt-2 text-foreground">{overview.paymentMethod}</dd>
        </div>
      </dl>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-foreground">Buy Credits</h2>
        {!owner ? (
          <div className="mt-4">
            <DisabledAction label="Buy Credits" reason={BUY_CREDITS_OWNER_ONLY} />
          </div>
        ) : buyReason ? (
          <div className="mt-4">
            <DisabledAction label="Buy Credits" reason={buyReason} />
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {oneTime.map((plan) => (
              <li key={plan.id} className="rounded-lg border border-border bg-surface p-5">
                <p className="font-display text-xl text-foreground">{plan.name}</p>
                <p className="mt-2 text-foreground">{plan.priceLabel}</p>
                <p className="mt-1 text-sm text-muted">{plan.creditLabel}</p>
                {setup.adapter === "payfast" && plan.currency === "USD" && plan.amountMinor != null ? (
                  <p className="mt-2 text-sm text-muted">
                    {payfastUsdChargeNote(formatMoney(usdToZarMinor(plan.amountMinor, usdZarRate), "ZAR"))}
                  </p>
                ) : null}
                <div className="mt-4">
                  {isPurchasablePlan({ ...plan, active: true }) ? (
                    <CheckoutButton planId={plan.id} label={`Buy ${plan.name}`} />
                  ) : (
                    <DisabledAction label={`Buy ${plan.name}`} reason={CHECKOUT_CUSTOM_PLAN} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {owner ? (
        <section className="mt-12">
          <h2 className="font-display text-2xl text-foreground">Monthly plans</h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {monthly.map((plan) => {
              const purchasable = isPurchasablePlan({ ...plan, active: true });
              const isCurrent = overview.subscription?.planCode === plan.code;
              const monthlyNeedsProviderPlan = setup.adapter === "payfast" || setup.adapter === "payoneer";
              const isUpgrade =
                currentCredits != null && plan.credits != null && plan.credits > currentCredits;
              const isDowngrade =
                currentCredits != null && plan.credits != null && plan.credits < currentCredits;
              const label = isCurrent
                ? "Current plan"
                : isUpgrade
                  ? `Upgrade to ${plan.name}`
                  : isDowngrade
                    ? `Downgrade to ${plan.name}`
                    : `Start ${plan.name}`;
              return (
                <li key={plan.id} className="rounded-lg border border-border bg-surface p-5">
                  <p className="font-display text-xl text-foreground">{plan.name}</p>
                  <p className="mt-2 text-foreground">{plan.priceLabel}</p>
                  <p className="mt-1 text-sm text-muted">{plan.creditLabel}</p>
                  <div className="mt-4">
                    {isCurrent ? (
                      <DisabledAction label={label} reason="This is your current monthly plan." />
                    ) : !purchasable ? (
                      <DisabledAction label={label} reason={CHECKOUT_CUSTOM_PLAN} />
                    ) : monthlyNeedsProviderPlan ? (
                      <DisabledAction label={label} reason={CHECKOUT_MONTHLY_UNAVAILABLE} />
                    ) : (
                      <CheckoutButton
                        planId={plan.id}
                        label={label}
                        endpoint="/api/billing/subscription"
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-6">
            {overview.subscription ? (
              overview.subscription.cancelAtPeriodEnd ? (
                <DisabledAction
                  label="Cancel subscription"
                  reason="This plan already cancels at the end of the current period."
                />
              ) : setup.adapter === "payfast" || setup.adapter === "payoneer" ? (
                <div>
                  <DisabledAction label="Cancel subscription" reason={CHECKOUT_CANCEL_NEEDS_PROVIDER} />
                  <Link
                    href="/dashboard/help"
                    className="mt-2 inline-flex min-h-11 items-center text-foreground underline"
                  >
                    Open Help
                  </Link>
                </div>
              ) : (
                <CancelSubscriptionButton />
              )
            ) : (
              <DisabledAction label="Cancel subscription" reason={CHECKOUT_NO_SUBSCRIPTION} />
            )}
          </div>
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="font-display text-2xl text-foreground">Billing history</h2>
        {overview.billingHistory.length === 0 ? (
          <p className="mt-4 rounded-lg border border-border bg-surface p-6 text-muted">
            No payments have been recorded for this studio. Receipts appear here when a payment is
            confirmed.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface">
            {overview.billingHistory.map((row) => (
              <li key={row.id} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:justify-between">
                <p className="text-foreground">
                  {formatMoney(row.amountMinor, row.currency)}
                  {row.planName ? ` · ${row.planName}` : ""} · {row.statusLabel}
                </p>
                <p className="text-sm text-muted">{formatStudioDate(row.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-foreground">Credit history</h2>
        {history.length === 0 ? (
          <p className="mt-4 rounded-lg border border-border bg-surface p-6 text-muted">
            No credit movements have been recorded for this studio.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface">
            {history.map((row) => (
              <li key={row.id} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:justify-between">
                <p className="text-foreground">
                  {row.amount > 0 ? "+" : ""}
                  {row.amount} · {row.description ?? creditTypeLabel(row.type)}
                </p>
                <p className="text-sm text-muted">{formatStudioDate(row.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
