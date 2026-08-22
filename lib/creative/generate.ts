import { resolveAdStrategy } from "@/lib/ai/ad-strategies";
import {
  generateConceptWithRetry,
  getCreativeDirector,
  type CreativeBrief,
  type CreativeDirectorProvider,
} from "@/lib/ai/creative-director";
import type { Db } from "@/lib/db/client";
import { businesses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getProjectBrief } from "@/lib/projects/queries";
import { briefReadyForConcept } from "@/lib/projects/save";
import { CONCEPT_NEED_BRIEF } from "./copy";
import { insertCreativeVersion } from "./persist";
import { assertConceptRateLimit } from "./rate-limit";
import { toPublicConcept } from "./public";

export async function buildCreativeBrief(db: Db, projectId: string): Promise<CreativeBrief> {
  const brief = await getProjectBrief(db, projectId);
  if (!brief) {
    throw new Error("You do not have access to that commercial.");
  }
  const ready = briefReadyForConcept(brief);
  if (!ready.ready) {
    throw new Error(ready.reason);
  }
  const [brand] = await db
    .select({ name: businesses.name, industry: businesses.industry })
    .from(businesses)
    .where(eq(businesses.id, brief.businessId))
    .limit(1);
  if (!brand) {
    throw new Error("That brand does not belong to this studio.");
  }
  return {
    businessName: brand.name,
    industry: brand.industry,
    campaignTitle: brief.title,
    advertisingType: brief.objective,
    targetCustomer: brief.targetCustomer,
    problem: brief.problem,
    valueProposition: brief.valueProposition,
    offer: brief.offer,
    ctaType: brief.ctaType,
    ctaValue: brief.ctaValue,
    style: brief.style,
    tones: brief.tones,
    avoid: brief.avoid,
    platform: brief.platform,
    aspectRatio: brief.aspectRatio,
    durationSeconds: brief.duration,
    strategy: resolveAdStrategy(brand.industry),
  };
}

export async function generateConceptForProject(
  db: Db,
  input: {
    projectId: string;
    workspaceId: string;
    userId: string;
    provider?: CreativeDirectorProvider;
  },
) {
  const brief = await getProjectBrief(db, input.projectId);
  if (!brief || brief.workspaceId !== input.workspaceId) {
    throw new Error("You do not have access to that commercial.");
  }
  const ready = briefReadyForConcept(brief);
  if (!ready.ready) {
    throw new Error(ready.reason || CONCEPT_NEED_BRIEF);
  }
  await assertConceptRateLimit(db, input.workspaceId);
  const creativeBrief = await buildCreativeBrief(db, input.projectId);
  const provider = input.provider ?? (await getCreativeDirector());
  const concept = await generateConceptWithRetry(provider, creativeBrief);
  const row = await insertCreativeVersion(db, {
    projectId: input.projectId,
    concept,
  });
  return toPublicConcept(row);
}
