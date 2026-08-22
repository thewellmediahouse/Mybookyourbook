/** Names that must never appear as NEXT_PUBLIC_* or in the browser bundle. */
export const SECRET_NAME_PATTERN =
  /^(?:REAPI_API_KEY|FAL_KEY|FAL_WEBHOOK_SECRET|TOPAZ_API_KEY|OPENAI_API_KEY|PAYSTACK_SECRET_KEY|PAYFAST_MERCHANT_KEY|PAYFAST_PASSPHRASE|BETTER_AUTH_SECRET|GOOGLE_CLIENT_SECRET|RESEND_API_KEY|INTERNAL_SERVICE_SECRET|R2_SECRET_ACCESS_KEY|R2_ACCESS_KEY_ID)$/;

export const FORBIDDEN_PUBLIC_ENV =
  /^NEXT_PUBLIC_(?:.*(?:SECRET|PRIVATE)|.*API_KEY|FAL_KEY|REAPI_API_KEY|PAYSTACK_SECRET|PAYFAST_MERCHANT_KEY|PAYFAST_PASSPHRASE)/i;

export const PUBLIC_ENV_ALLOWLIST = ["NEXT_PUBLIC_APP_NAME", "NEXT_PUBLIC_APP_URL"] as const;

export function isForbiddenPublicEnvName(name: string) {
  return FORBIDDEN_PUBLIC_ENV.test(name.trim());
}

export function publicEnvLines(exampleFile: string) {
  return exampleFile
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("NEXT_PUBLIC_"))
    .map((line) => line.split("=")[0]?.trim() ?? "");
}

export function secretNamesInText(text: string) {
  const names = [
    "REAPI_API_KEY",
    "FAL_KEY",
    "TOPAZ_API_KEY",
    "OPENAI_API_KEY",
    "PAYSTACK_SECRET_KEY",
    "PAYFAST_MERCHANT_KEY",
    "PAYFAST_PASSPHRASE",
    "BETTER_AUTH_SECRET",
    "GOOGLE_CLIENT_SECRET",
    "RESEND_API_KEY",
    "INTERNAL_SERVICE_SECRET",
    "R2_SECRET_ACCESS_KEY",
  ];
  return names.filter((name) => text.includes(`${name}=`) || new RegExp(`${name}["'\\s]*:`).test(text));
}
