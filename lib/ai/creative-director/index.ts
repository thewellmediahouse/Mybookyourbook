import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createMockCreativeDirector } from "./mock";
import { createOpenAiCreativeDirector } from "./openai";
import type { CreativeDirectorProvider } from "./types";

export { generateConceptWithRetry } from "./retry";
export { parseCreativeConcept, creativeConceptSchema } from "./schema";
export { createMockCreativeDirector } from "./mock";
export { createOpenAiCreativeDirector } from "./openai";
export type {
  ConceptScene,
  CreativeBrief,
  CreativeConcept,
  CreativeDirectorProvider,
  PublicCreativeConcept,
} from "./types";

type ProviderEnv = {
  AI_PROVIDER_MODE?: string;
  CONCEPT_AI_MODE?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
};

export function isLiveAiMode(env: ProviderEnv): boolean {
  return String(env.AI_PROVIDER_MODE ?? "mock").trim().toLowerCase() === "live";
}

/** Commercial Concept only. Filming / enhancement / branding still follow AI_PROVIDER_MODE. */
export function isLiveConceptMode(env: ProviderEnv): boolean {
  const concept = String(env.CONCEPT_AI_MODE ?? "").trim().toLowerCase();
  if (concept === "live") {
    return true;
  }
  if (concept === "mock") {
    return false;
  }
  return isLiveAiMode(env);
}

export function createCreativeDirector(env: ProviderEnv): CreativeDirectorProvider {
  if (isLiveConceptMode(env)) {
    return createOpenAiCreativeDirector(env);
  }
  return createMockCreativeDirector();
}

export async function getCreativeDirector(): Promise<CreativeDirectorProvider> {
  // Node's test runner sets this. Integration tests must pass an explicit mock provider
  // if they generate a concept; this keeps getPlatformProxy from calling OpenAI.
  if (process.env.NODE_TEST_CONTEXT) {
    return createMockCreativeDirector();
  }
  const { env } = await getCloudflareContext({ async: true });
  return createCreativeDirector(env as ProviderEnv);
}
