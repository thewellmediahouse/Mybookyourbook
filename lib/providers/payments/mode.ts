export type PaymentsEnv = {
  PAYMENTS_MODE?: string;
  PAYONEER_MODE?: string;
  PAYONEER_USERNAME?: string;
  PAYONEER_TOKEN?: string;
  PAYFAST_MODE?: string;
  PAYFAST_MERCHANT_ID?: string;
  PAYFAST_MERCHANT_KEY?: string;
  PAYFAST_PASSPHRASE?: string;
  PAYFAST_USD_ZAR_RATE?: string;
  PAYSTACK_SECRET_KEY?: string;
  PAYSTACK_PUBLIC_KEY?: string;
};

export type PaymentsAdapter = "mock" | "payoneer" | "payfast";

export type PayFastMode = "sandbox" | "live";

export type PayoneerMode = "sandbox" | "live";

export type PaymentsSetup = {
  mode: "test" | "live";
  adapter: PaymentsAdapter;
  checkoutAvailable: boolean;
  webhookSecret: string | null;
  payfastMode: PayFastMode | null;
  merchantId: string | null;
  merchantKey: string | null;
  passphrase: string | null;
  payoneerMode: PayoneerMode | null;
  payoneerUsername: string | null;
  payoneerToken: string | null;
};

function readEnvMode(raw: string | undefined): PayoneerMode | PayFastMode | null {
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

function payoneerCredentials(env: PaymentsEnv): {
  username: string | null;
  token: string | null;
} {
  const username = env.PAYONEER_USERNAME?.trim() || null;
  const token = env.PAYONEER_TOKEN?.trim() || null;
  return { username, token };
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
    payoneerMode: extras?.payoneerMode ?? null,
    payoneerUsername: extras?.payoneerUsername ?? null,
    payoneerToken: extras?.payoneerToken ?? null,
  };
}

function emptyPayfast(): Pick<PaymentsSetup, "payfastMode" | "merchantId" | "merchantKey" | "passphrase"> {
  return {
    payfastMode: null,
    merchantId: null,
    merchantKey: null,
    passphrase: null,
  };
}

export function getPaymentsSetup(env: PaymentsEnv): PaymentsSetup {
  const mode: "test" | "live" = isLivePayments(env) ? "live" : "test";
  const payoneerMode = readEnvMode(env.PAYONEER_MODE);
  const { username, token } = payoneerCredentials(env);
  const hasPayoneer = Boolean(username && token);
  const { merchantId, merchantKey, passphrase } = payfastCredentials(env);

  if (mode === "test") {
    if (payoneerMode === "live") {
      return unavailable(mode, "payoneer", {
        ...emptyPayfast(),
        payoneerMode,
        payoneerUsername: username,
        payoneerToken: token,
      });
    }
    if (hasPayoneer && payoneerMode === "sandbox") {
      return {
        mode,
        adapter: "payoneer",
        checkoutAvailable: true,
        webhookSecret: null,
        ...emptyPayfast(),
        payoneerMode,
        payoneerUsername: username,
        payoneerToken: token,
      };
    }
    if (hasPayoneer && payoneerMode == null) {
      return unavailable(mode, "payoneer", {
        ...emptyPayfast(),
        payoneerMode: null,
        payoneerUsername: username,
        payoneerToken: token,
      });
    }
    return {
      mode,
      adapter: "mock",
      checkoutAvailable: true,
      webhookSecret: null,
      ...emptyPayfast(),
      payoneerMode: null,
      payoneerUsername: null,
      payoneerToken: null,
    };
  }

  if (payoneerMode === "sandbox") {
    return unavailable(mode, "payoneer", {
      ...emptyPayfast(),
      payoneerMode,
      payoneerUsername: username,
      payoneerToken: token,
    });
  }
  if (hasPayoneer && payoneerMode === "live") {
    return {
      mode,
      adapter: "payoneer",
      checkoutAvailable: true,
      webhookSecret: null,
      ...emptyPayfast(),
      payoneerMode,
      payoneerUsername: username,
      payoneerToken: token,
    };
  }
  return unavailable(mode, "payoneer", {
    payfastMode: null,
    merchantId,
    merchantKey,
    passphrase,
    payoneerMode,
    payoneerUsername: username,
    payoneerToken: token,
  });
}
