import { createMockVideoProvider } from "./mock";
import { createReapiVideoProvider } from "./reapi";
import type { VideoGenerationProvider } from "./types";

export type { VideoGenerationProvider, VideoSubmitInput } from "./types";
export { createMockVideoProvider } from "./mock";
export { createReapiVideoProvider } from "./reapi";
export {
  seedanceSubmitBody,
  SEEDANCE_MODEL_ID,
  SEEDANCE_RESOLUTION,
  SEEDANCE_DURATION,
  REAPI_API_BASE,
  REAPI_VIDEOS_URL,
} from "./payload";

type VideoEnv = {
  AI_PROVIDER_MODE?: string;
  FILMING_AI_MODE?: string;
  REAPI_API_KEY?: string;
};

const LIVE_NOT_CONNECTED = "Live filming is not connected yet.";

function isLivePipelineMode(env: Pick<VideoEnv, "AI_PROVIDER_MODE">): boolean {
  return String(env.AI_PROVIDER_MODE ?? "mock").trim().toLowerCase() === "live";
}

/** Filming only. Enhancement / branding still follow AI_PROVIDER_MODE. */
export function isLiveVideoMode(env: VideoEnv): boolean {
  const filming = String(env.FILMING_AI_MODE ?? "").trim().toLowerCase();
  if (filming === "live") {
    return true;
  }
  if (filming === "mock") {
    return false;
  }
  return isLivePipelineMode(env);
}

function disconnectedVideoProvider(message: string): VideoGenerationProvider {
  return {
    async submit() {
      throw new Error(message);
    },
    async getStatus() {
      throw new Error(message);
    },
    async getResult() {
      throw new Error(message);
    },
  };
}

export function createVideoGenerationProvider(env: VideoEnv): VideoGenerationProvider {
  if (!isLiveVideoMode(env)) {
    return createMockVideoProvider();
  }
  const apiKey = env.REAPI_API_KEY?.trim();
  if (!apiKey) {
    return disconnectedVideoProvider(LIVE_NOT_CONNECTED);
  }
  return createReapiVideoProvider({ apiKey });
}
