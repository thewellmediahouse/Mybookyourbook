import { WorkflowEntrypoint } from "cloudflare:workers";
import type { WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import { createDb } from "@/lib/db/client";
import { pipelineDepsFromEnv } from "@/lib/production/deps";
import { runCommercialProduction, type ProductionParams } from "@/lib/production/pipeline";

type WorkflowEnv = {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  AI_PROVIDER_MODE?: string;
  REAPI_API_KEY?: string;
  TOPAZ_API_KEY?: string;
  TOPAZ_DEFAULT_MODEL?: string;
  INTERNAL_SERVICE_SECRET?: string;
  MEDIA_PROCESSING?: DurableObjectNamespace;
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
};

export class CommercialProductionWorkflow extends WorkflowEntrypoint<WorkflowEnv, ProductionParams> {
  async run(event: WorkflowEvent<ProductionParams>, step: WorkflowStep) {
    const env = this.env;
    return runCommercialProduction(
      pipelineDepsFromEnv(env as unknown as Record<string, unknown>, createDb(env.DB), env.MEDIA_BUCKET),
      event.payload,
      {
        async do<T>(name: string, callback: () => Promise<T>): Promise<T> {
          return (await step.do(name, async () => (await callback()) as never)) as T;
        },
        async sleep(name, duration) {
          await step.sleep(name, duration as `${number} seconds`);
        },
      },
    );
  }
}
