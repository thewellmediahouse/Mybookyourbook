import { NextResponse } from "next/server";
import { fromAdminCaught } from "@/lib/api/http";
import { requireAdminApi } from "@/lib/admin/access";
import { parseAdminEmails } from "@/lib/authz/admin";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { adminRetryJob } from "@/lib/admin/jobs";
import { pipelineDepsFromEnv } from "@/lib/production/deps";
import { immediateStep, runCommercialProduction, type ProductionParams } from "@/lib/production/pipeline";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await requireAdminApi();
    const { env, ctx: execution } = await getCloudflareContext({ async: true });
    const adminEmails = parseAdminEmails(
      "ADMIN_EMAILS" in env ? String((env as { ADMIN_EMAILS?: string }).ADMIN_EMAILS ?? "") : "",
    );
    const productionEnv = env as {
      MEDIA_BUCKET: R2Bucket;
      COMMERCIAL_PRODUCTION_WORKFLOW?: {
        create: (input: { id?: string; params?: ProductionParams }) => Promise<{ id: string }>;
      };
    };
    const deps = pipelineDepsFromEnv(env as unknown as Record<string, unknown>, session.db, productionEnv.MEDIA_BUCKET);
    const result = await adminRetryJob(session.db, { ...session, adminEmails }, id, {
      ...deps,
      startWorkflow: async (params) => {
        const binding = productionEnv.COMMERCIAL_PRODUCTION_WORKFLOW;
        if (binding && typeof binding.create === "function") {
          return binding.create({ id: `${params.jobId}-retry`, params });
        }
        execution.waitUntil(runCommercialProduction(deps, params, immediateStep()).catch(() => undefined));
        return { id: params.jobId };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return fromAdminCaught(error);
  }
}
