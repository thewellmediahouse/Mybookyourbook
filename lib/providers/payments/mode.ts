export type PaymentsEnv = {
  PAYMENTS_MODE?: string;
  PAYFAST_MODE?: string;
  PAYFAST_MERCHANT_ID?: string;
  PAYFAST_MERCHANT_KEY?: string;
  PAYFAST_PASSPHRASE?: string;
  PAYSTACK_SECRET_KEY?: string;
  PAYSTACK_PUBLIC_KEY?: string;
};

export type PaymentsAdapter = "mock" | "payfast";

export type PayFastMode = "sandbox" | "live";

export type PaymentsSetup = {
  mode: "test" | "live";
  adapter: PaymentsAdapter;
  checkoutAvailable: boolean;
  webhookSecret: string | null;
  payfastMode: PayFastMode | null;
  merchantId: string | null;
  merchantKey: string | null;
  passphrase: string | null;
};

function readPayfastMode(raw: string | undefined): PayFastMode | null {
  const mode = String(raw ?? "").trim().toLowerCase();
  if (mode === "live") {
    return "live";
  }
  if (mode === "sandbox") {
    return "sandbox";
  }
  return null;
}

export function isLivePayments(env: PaymentsEnv): boolean {
  return String(env.PAYMENTS_MODE ?? "test").trim().toLowerCase() === "live";
}

function payfastCredentials(env: PaymentsEnv): {
  merchantId: string | null;
  merchantKey: string | null;
  passphrase: string | null;
} {
  const merchantId = env.PAYFAST_MERCHANT_ID?.trim() || null;
  const merchantKey = env.PAYFAST_MERCHANT_KEY?.trim() || null;
  const passphrase = env.PAYFAST_PASSPHRASE?.trim() || null;
  return { merchantId, merchantKey, passphrase };
}

function unavailable(
  mode: "test" | "live",
  adapter: PaymentsAdapter,
  extras?: Partial<PaymentsSetup>,
): PaymentsSetup {
  return {
    mode,
    adapter,
    checkoutAvailable: false,
    webhookSecret: null,
    payfastMode: extras?.payfastMode ?? null,
    merchantId: extras?.merchantId ?? null,
    merchantKey: extras?.merchantKey ?? null,
    passphrase: extras?.passphrase ?? null,
  };
}

export function getPaymentsSetup(env: PaymentsEnv): PaymentsSetup {
  const mode: "test" | "live" = isLivePayments(env) ? "live" : "test";
  const payfastMode = readPayfastMode(env.PAYFAST_MODE);
  const { merchantId, merchantKey, passphrase } = payfastCredentials(env);
  const hasCredentials = Boolean(merchantId && merchantKey);

  if (mode === "test") {
    if (payfastMode === "live") {
      return unavailable(mode, "payfast", { payfastMode, merchantId, merchantKey, passphrase });
    }
    if (hasCredentials && payfastMode === "sandbox") {
      return {
        mode,
        adapter: "payfast",
        checkoutAvailable: true,
        webhookSecret: passphrase,
        payfastMode,
        merchantId,
        merchantKey,
        passphrase,
      };
    }
    if (hasCredentials && payfastMode == null) {
      return unavailable(mode, "payfast", { payfastMode: null, merchantId, merchantKey, passphrase });
    }
    return {
      mode,
      adapter: "mock",
      checkoutAvailable: true,
      webhookSecret: null,
      payfastMode: null,
      merchantId: null,
      merchantKey: null,
      passphrase: null,
    };
  }

  if (payfastMode === "sandbox") {
    return unavailable(mode, "payfast", { payfastMode, merchantId, merchantKey, passphrase });
  }
  if (hasCredentials && payfastMode === "live") {
    return {
      mode,
      adapter: "payfast",
      checkoutAvailable: true,
      webhookSecret: passphrase,
      payfastMode,
      merchantId,
      merchantKey,
      passphrase,
    };
  }
  return unavailable(mode, "payfast", { payfastMode, merchantId, merchantKey, passphrase });
}
