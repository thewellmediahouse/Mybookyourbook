import type { Db } from "@/lib/db/client";
import { dispatchEmail, type NotificationEnv } from "@/lib/notifications/queue";
import type { EmailQueueMessage } from "@/lib/notifications/messages";
import { getAuthBaseUrl } from "@/lib/auth/env";
import { createBrandingProvider } from "@/lib/providers/branding";
import { createUpscaleProvider } from "@/lib/providers/upscale/topaz";
import { createVideoGenerationProvider, isLiveVideoMode } from "@/lib/providers/video/seedance";
import type { PipelineDeps } from "./pipeline";
import { createProductionUrlSigner } from "./references";

export function pipelineDepsFromEnv(
  env: Record<string, unknown>,
  db: Db,
  bucket: R2Bucket,
): PipelineDeps {
  const providerEnv = env as {
    AI_PROVIDER_MODE?: string;
    FILMING_AI_MODE?: string;
    REAPI_API_KEY?: string;
    TOPAZ_API_KEY?: string;
    TOPAZ_DEFAULT_MODEL?: string;
    INTERNAL_SERVICE_SECRET?: string;
    MEDIA_PROCESSING?: DurableObjectNamespace;
  };
  const live = String(providerEnv.AI_PROVIDER_MODE ?? "mock").trim().toLowerCase() === "live";
  const binding = providerEnv.MEDIA_PROCESSING;
  return {
    db,
    bucket,
    video: createVideoGenerationProvider(providerEnv),
    upscale: createUpscaleProvider(providerEnv),
    branding: createBrandingProvider({
      AI_PROVIDER_MODE: providerEnv.AI_PROVIDER_MODE,
      INTERNAL_SERVICE_SECRET: providerEnv.INTERNAL_SERVICE_SECRET,
      requestContainer:
        live && binding
          ? async (path, init) => {
              const { fetchMediaProcessing } = await import("@/lib/containers/request");
              return fetchMediaProcessing(binding as never, path, init);
            }
          : undefined,
    }),
    signGetUrl: createProductionUrlSigner(env),
    requireReferenceUrls: isLiveVideoMode(providerEnv),
    appUrl: getAuthBaseUrl(env as { BETTER_AUTH_URL?: string; NEXT_PUBLIC_APP_URL?: string }),
    enqueueEmail: (message: EmailQueueMessage) => dispatchEmail(env as NotificationEnv, message),
  };
}
