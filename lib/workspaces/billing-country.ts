/** Billing country is the authority for ZA vs international list prices. */
export function billingForCountry(country: string): {
  country: string;
  region: "ZA" | "INT";
  billingCurrency: "ZAR" | "USD";
} {
  const code = country.trim().toUpperCase();
  if (code === "ZA" || code === "SOUTH AFRICA") {
    return { country: "ZA", region: "ZA", billingCurrency: "ZAR" };
  }
  return { country: code || "INT", region: "INT", billingCurrency: "USD" };
}
