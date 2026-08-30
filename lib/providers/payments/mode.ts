export type PaymentsEnv = {
  PAYMENTS_MODE?: string;
  RAPYD_MODE?: string;
  RAPYD_ACCESS_KEY?: string;
  RAPYD_SECRET_KEY?: string;
  RAPYD_WEBHOOK_URL?: string;
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

export type PaymentsAdapter = "mock" | "rapyd" | "payoneer" | "payfast";

export type PayFastMode = "sandbox" | "live";

export type PayoneerMode = "sandbox" | "live";

export type RapydMode = "sandbox" | "live";

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
  rapydMode: RapydMode | null;
  rapydAccessKey: string | null;
  rapydSecretKey: string | null;
  rapydWebhookUrl: string | null;
};

function readEnvMode(raw: string | undefined): RapydMode | PayoneerMode | PayFastMode | null {
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

function rapydCredentials(env: PaymentsEnv): {
  accessKey: string | null;
  secretKey: string | null;
  webhookUrl: string | null;
} {
  return {
    accessKey: env.RAPYD_ACCESS_KEY?.trim() || null,
    secretKey: env.RAPYD_SECRET_KEY?.trim() || null,
    webhookUrl: env.RAPYD_WEBHOOK_URL?.trim() || null,
  };
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

function emptyPayfast(): Pick<PaymentsSetup, "payfastMode" | "merchantId" | "merchantKey" | "passphrase"> {
  return {
    payfastMode: null,
    merchantId: null,
    merchantKey: null,
    passphrase: null,
  };
}

function emptyPayoneer(): Pick<PaymentsSetup, "payoneerMode" | "payoneerUsername" | "payoneerToken"> {
  return {
    payoneerMode: null,
    payoneerUsername: null,
    payoneerToken: null,
  };
}

function emptyRapyd(): Pick<
  PaymentsSetup,
  "rapydMode" | "rapydAccessKey" | "rapydSecretKey" | "rapydWebhookUrl"
> {
  return {
    rapydMode: null,
    rapydAccessKey: null,
    rapydSecretKey: null,
    rapydWebhookUrl: null,
  };
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
    rapydMode: extras?.rapydMode ?? null,
    rapydAccessKey: extras?.rapydAccessKey ?? null,
    rapydSecretKey: extras?.rapydSecretKey ?? null,
    rapydWebhookUrl: extras?.rapydWebhookUrl ?? null,
  };
}

export function getPaymentsSetup(env: PaymentsEnv): PaymentsSetup {
  const mode: "test" | "live" = isLivePayments(env) ? "live" : "test";
  const rapydMode = readEnvMode(env.RAPYD_MODE);
  const { accessKey, secretKey, webhookUrl } = rapydCredentials(env);
  const hasRapyd = Boolean(accessKey && secretKey);
  const payoneerMode = readEnvMode(env.PAYONEER_MODE);
  const { username, token } = payoneerCredentials(env);
  const hasPayoneer = Boolean(username && token);
  const { merchantId, merchantKey, passphrase } = payfastCredentials(env);

  if (mode === "test") {
    if (rapydMode === "live") {
      return unavailable(mode, "rapyd", {
        ...emptyPayfast(),
        ...emptyPayoneer(),
        rapydMode,
        rapydAccessKey: accessKey,
        rapydSecretKey: secretKey,
        rapydWebhookUrl: webhookUrl,
      });
    }
    if (rapydMode === "sandbox") {
      if (hasRapyd) {
        return {
          mode,
          adapter: "rapyd",
          checkoutAvailable: true,
          webhookSecret: null,
          ...emptyPayfast(),
          ...emptyPayoneer(),
          rapydMode,
          rapydAccessKey: accessKey,
          rapydSecretKey: secretKey,
          rapydWebhookUrl: webhookUrl,
        };
      }
      return unavailable(mode, "rapyd", {
        ...emptyPayfast(),
        ...emptyPayoneer(),
        rapydMode,
        rapydAccessKey: accessKey,
        rapydSecretKey: secretKey,
        rapydWebhookUrl: webhookUrl,
      });
    }
    if (hasRapyd && rapydMode == null) {
      return unavailable(mode, "rapyd", {
        ...emptyPayfast(),
        ...emptyPayoneer(),
        rapydMode: null,
        rapydAccessKey: accessKey,
        rapydSecretKey: secretKey,
        rapydWebhookUrl: webhookUrl,
      });
    }
    if (payoneerMode === "live") {
      return unavailable(mode, "payoneer", {
        ...emptyPayfast(),
        ...emptyRapyd(),
        payoneerMode,
        payoneerUsername: username,
        payoneerToken: token,
      });
    }
    if (payoneerMode === "sandbox") {
      if (hasPayoneer) {
        return {
          mode,
          adapter: "payoneer",
          checkoutAvailable: true,
          webhookSecret: null,
          ...emptyPayfast(),
          ...emptyRapyd(),
          payoneerMode,
          payoneerUsername: username,
          payoneerToken: token,
        };
      }
      return unavailable(mode, "payoneer", {
        ...emptyPayfast(),
        ...emptyRapyd(),
        payoneerMode,
        payoneerUsername: username,
        payoneerToken: token,
      });
    }
    if (hasPayoneer && payoneerMode == null) {
      return unavailable(mode, "payoneer", {
        ...emptyPayfast(),
        ...emptyRapyd(),
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
      ...emptyPayoneer(),
      ...emptyRapyd(),
    };
  }

  if (rapydMode === "sandbox") {
    return unavailable(mode, "rapyd", {
      ...emptyPayfast(),
      ...emptyPayoneer(),
      rapydMode,
      rapydAccessKey: accessKey,
      rapydSecretKey: secretKey,
      rapydWebhookUrl: webhookUrl,
    });
  }
  if (hasRapyd && rapydMode === "live") {
    return {
      mode,
      adapter: "rapyd",
      checkoutAvailable: true,
      webhookSecret: null,
      ...emptyPayfast(),
      ...emptyPayoneer(),
      rapydMode,
      rapydAccessKey: accessKey,
      rapydSecretKey: secretKey,
      rapydWebhookUrl: webhookUrl,
    };
  }
  if (payoneerMode === "sandbox") {
    return unavailable(mode, "payoneer", {
      ...emptyPayfast(),
      ...emptyRapyd(),
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
      ...emptyRapyd(),
      payoneerMode,
      payoneerUsername: username,
      payoneerToken: token,
    };
  }
  return unavailable(mode, hasRapyd ? "rapyd" : "payoneer", {
    payfastMode: null,
    merchantId,
    merchantKey,
    passphrase,
    payoneerMode,
    payoneerUsername: username,
    payoneerToken: token,
    rapydMode,
    rapydAccessKey: accessKey,
    rapydSecretKey: secretKey,
    rapydWebhookUrl: webhookUrl,
  });
}
