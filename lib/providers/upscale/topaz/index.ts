import { createMockUpscaleProvider } from "./mock";
import { createTopazUpscaleProvider } from "./live";
import type { UpscaleProvider } from "./types";

export type { UpscaleProvider, UpscaleCreateInput, UpscaleJob, UpscaleResult } from "./types";
export { createMockUpscaleProvider } from "./mock";
export { createTopazUpscaleProvider } from "./live";
export {
  output1080pSize,
  resolveTopazModel,
  source480pSize,
  splitUploadParts,
  TOPAZ_API_BASE,
  TOPAZ_DEFAULT_MODEL,
  topazCreateBody,
} from "./payload";

type UpscaleEnv = {
  AI_PROVIDER_MODE?: string;
  ENHANCEMENT_AI_MODE?: string;
  TOPAZ_API_KEY?: string;
  TOPAZ_DEFAULT_MODEL?: string;
};

const LIVE_NOT_CONNECTED = "Live enhancement is not connected yet.";

function isLivePipelineMode(env: Pick<UpscaleEnv, "AI_PROVIDER_MODE">): boolean {
  return String(env.AI_PROVIDER_MODE ?? "mock").trim().toLowerCase() === "live";
}

/** Enhancement only. Branding still follows AI_PROVIDER_MODE. */
export function isLiveUpscaleMode(env: UpscaleEnv): boolean {
  const enhancement = String(env.ENHANCEMENT_AI_MODE ?? "").trim().toLowerCase();
  if (enhancement === "live") {
    return true;
  }
  if (enhancement === "mock") {
    return false;
  }
  return isLivePipelineMode(env);
}

function disconnectedUpscaleProvider(message: string): UpscaleProvider {
  async function refuse(): Promise<never> {
    throw new Error(message);
  }
  return {
    create: refuse,
    accept: refuse,
    upload: refuse,
    completeUpload: refuse,
    poll: refuse,
    complete: refuse,
    retrieve: refuse,
  };
}

export function createUpscaleProvider(env: UpscaleEnv): UpscaleProvider {
  if (!isLiveUpscaleMode(env)) {
    return createMockUpscaleProvider();
  }
  const apiKey = env.TOPAZ_API_KEY?.trim();
  if (!apiKey) {
    return disconnectedUpscaleProvider(LIVE_NOT_CONNECTED);
  }
  return createTopazUpscaleProvider({
    apiKey,
    model: env.TOPAZ_DEFAULT_MODEL,
  });
}
