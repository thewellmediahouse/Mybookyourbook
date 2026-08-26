import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PaymentError, getPaymentsSetup, tryGetPaymentProvider } from "@/lib/providers/payments";
import type { PaymentProvider, PaymentsAdapter, PaymentsEnv } from "@/lib/providers/payments";

export async function getPaymentsEnv(): Promise<
  PaymentsEnv & { BETTER_AUTH_URL?: string; NEXT_PUBLIC_APP_URL?: string }
> {
  const { env } = await getCloudflareContext({ async: true });
  return env as PaymentsEnv & { BETTER_AUTH_URL?: string; NEXT_PUBLIC_APP_URL?: string };
}

export async function getConnectedPaymentProvider(): Promise<{
  provider: PaymentProvider;
  adapter: PaymentsAdapter;
  requireProviderPlanCode: boolean;
}> {
  const env = await getPaymentsEnv();
  const setup = getPaymentsSetup(env);
  const provider = tryGetPaymentProvider(env);
  if (!provider || !setup.checkoutAvailable) {
    throw new PaymentError("NOT_CONNECTED", "Payment is not connected.");
  }
  return {
    provider,
    adapter: setup.adapter,
    requireProviderPlanCode: false,
  };
}

export function checkoutCallbackUrl(env: { BETTER_AUTH_URL?: string; NEXT_PUBLIC_APP_URL?: string }): string {
  const base = env.BETTER_AUTH_URL?.trim() || env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/dashboard/billing`;
}

export { getPaymentsSetup };
