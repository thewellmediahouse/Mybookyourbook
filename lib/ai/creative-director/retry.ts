import { parseCreativeConcept } from "./schema";
import type { CreativeBrief, CreativeConcept, CreativeDirectorProvider } from "./types";

export async function generateConceptWithRetry(
  provider: CreativeDirectorProvider,
  input: CreativeBrief,
): Promise<CreativeConcept> {
  try {
    return parseCreativeConcept(await provider.generateConcept(input));
  } catch {
    return parseCreativeConcept(await provider.generateConcept(input));
  }
}
