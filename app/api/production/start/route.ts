import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { fromCaught, jsonError } from "@/lib/api/http";
import { requireProjectEditor } from "@/lib/api/projects";
import { ProductionError } from "@/lib/production/errors";
import { pipelineDepsFromEnv } from "@/lib/production/deps";
import { immediateStep, runCommercialProduction, type ProductionParams } from "@/lib/production/pipeline";
import { startProduction } from "@/lib/production/start";
import { assertRateLimit, assertWorkersRateLimit, type WorkersRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

type ProductionEnv = {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  AI_PROVIDER_MODE?: string;
  REAPI_API_KEY?: string;
  COMMERCIAL_PRODUCTION_WORKFLOW?: {
    create: (input: { id?: string; params?: ProductionParams }) => Promise<{ id: string }>;
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { projectId?: string };
    if (!body.projectId) {
      return jsonError("Save the commercial before filming.", 400);
    }
    const ctx = await requireProjectEditor(body.projectId);
    const { env, ctx: execution } = await getCloudflareContext({ async: true });
    await assertRateLimit(ctx.db, "production", ctx.workspaceId);
    await assertWorkersRateLimit(
      (env as { PRODUCTION_RATE_LIMIT?: WorkersRateLimit }).PRODUCTION_RATE_LIMIT,
      `production:${ctx.workspaceId}`,
    );
    const productionEnv = env as ProductionEnv;
    const deps = pipelineDepsFromEnv(
      productionEnv as unknown as Record<string, unknown>,
      ctx.db,
      productionEnv.MEDIA_BUCKET,
    );

    const result = await startProduction(
      ctx.db,
      {
        projectId: ctx.project.id,
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
      },
      {
        ...deps,
        startWorkflow: async (params) => {
          const binding = productionEnv.COMMERCIAL_PRODUCTION_WORKFLOW;
          if (binding && typeof binding.create === "function") {
            return binding.create({ id: params.jobId, params });
          }
          execution.waitUntil(
            runCommercialProduction(deps, params, immediateStep()).catch(() => undefined),
          );
          return { id: params.jobId };
        },
      },
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ProductionError) {
      const status = error.code === "NO_CREDITS" || error.code === "DUPLICATE" ? 409 : 400;
      return jsonError(error.message, status);
    }
    return fromCaught(error);
  }
}
