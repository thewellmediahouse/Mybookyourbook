import { createMockBrandingProvider } from "./mock";
import { createContainerBrandingProvider } from "./live";
import type { BrandingContainerRequest, BrandingProvider } from "./types";

export type { BrandingProvider, BrandingInput, BrandingResult, BrandingMediaInfo } from "./types";
export { createMockBrandingProvider } from "./mock";
export { createContainerBrandingProvider } from "./live";
export { brandingTextLines, overlayLogoPosition, resolveLogoPosition, shouldIncludeEndCard } from "./overlay";
export { decodeBrandingEnvelope, encodeBrandingEnvelope } from "./envelope";

type BrandingEnv = {
  AI_PROVIDER_MODE?: string;
  INTERNAL_SERVICE_SECRET?: string;
  requestContainer?: BrandingContainerRequest;
};

const LIVE_NOT_CONNECTED = "Adding your brand in post is not connected yet.";

export function isLiveBrandingMode(env: BrandingEnv): boolean {
  return String(env.AI_PROVIDER_MODE ?? "mock").trim().toLowerCase() === "live";
}

function disconnectedBrandingProvider(message: string): BrandingProvider {
  return {
    async apply() {
      throw new Error(message);
    },
  };
}

export function createBrandingProvider(env: BrandingEnv): BrandingProvider {
  if (!isLiveBrandingMode(env)) {
    return createMockBrandingProvider();
  }
  const secret = env.INTERNAL_SERVICE_SECRET?.trim();
  if (!secret || !env.requestContainer) {
    return disconnectedBrandingProvider(LIVE_NOT_CONNECTED);
  }
  return createContainerBrandingProvider({
    secret,
    request: env.requestContainer,
  });
}
