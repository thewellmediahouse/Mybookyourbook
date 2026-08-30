import type { ConceptScene } from "@/lib/ai/creative-director";
import {
  BACKGROUND_SIGNAGE_INSTRUCTION,
  NO_GENERATED_TEXT_INSTRUCTION,
  NO_SMALL_CTA_INSTRUCTION,
  SCENE_NO_WRITING_LINE,
  sanitizeFilmedSceneFields,
} from "@/lib/creative/on-screen-text";
import { IDENTITY_REFERENCE_MAP } from "@/lib/identity/slots";
import {
  CONTEXT_SLOTS,
  DURATION_CHOICE,
  isDuration,
  requireExplicitAspectRatio,
  type AspectRatio,
} from "@/lib/projects/brief";

export {
  BACKGROUND_SIGNAGE_INSTRUCTION,
  NO_GENERATED_TEXT_INSTRUCTION,
  NO_SMALL_CTA_INSTRUCTION,
  SCENE_NO_WRITING_LINE,
};

export const IDENTITY_INSTRUCTION =
  "The primary presenter must remain the same adult person represented by @Image1, @Image2, @Image3 and @Video1. Preserve recognisable facial structure, hairstyle, age, skin appearance and body proportions consistently throughout the commercial. Use @Video1 as the primary reference for natural speaking style, facial movement, voice/accent where supported, mannerisms and presentation.";

export const LOGO_REFERENCE_TAG = "@Image4";
export const LOGO_REFERENCE_INSTRUCTION =
  "Show the supplied brand mark from @Image4 as a graphic when it fits naturally (a sign, product, vehicle, or printed mark). Use that exact mark. Do not invent letters, a different logo, or extra writing.";

/** Internal mapping only. Never shown to customers. Identity uses @Image1–3 and @Video1. */
export function contextReferenceTag(
  slot: (typeof CONTEXT_SLOTS)[number],
  includeLogo: boolean,
): string {
  const index = CONTEXT_SLOTS.indexOf(slot);
  return `@Image${(includeLogo ? 5 : 4) + index}`;
}

export const CONTEXT_REFERENCE_MAP: Record<(typeof CONTEXT_SLOTS)[number], string> = {
  CONTEXT_1: contextReferenceTag("CONTEXT_1", false),
  CONTEXT_2: contextReferenceTag("CONTEXT_2", false),
  CONTEXT_3: contextReferenceTag("CONTEXT_3", false),
  CONTEXT_4: contextReferenceTag("CONTEXT_4", false),
  CONTEXT_5: contextReferenceTag("CONTEXT_5", false),
  CONTEXT_6: contextReferenceTag("CONTEXT_6", false),
};

export type SeedancePromptInput = {
  approvedScript: string;
  scenes: ConceptScene[];
  aspectRatio: string;
  durationSeconds: number;
  style: string;
  contextSlots?: string[];
  includeLogo?: boolean;
  /** Ignored. Prompt generation must not rewrite approved spoken words. */
  draftScript?: string;
};

function mappingBlock(contextSlots: string[], includeLogo: boolean): string {
  const lines = [
    "Reference mapping:",
    `${IDENTITY_REFERENCE_MAP.IDENTITY_FRONT} = identity front`,
    `${IDENTITY_REFERENCE_MAP.IDENTITY_LEFT} = identity left`,
    `${IDENTITY_REFERENCE_MAP.IDENTITY_RIGHT} = identity right`,
    `${IDENTITY_REFERENCE_MAP.IDENTITY_VIDEO} = presenter video`,
  ];
  if (includeLogo) {
    lines.push(`${LOGO_REFERENCE_TAG} = brand mark`);
  }
  const used = CONTEXT_SLOTS.filter((slot) => contextSlots.includes(slot));
  for (const slot of used) {
    lines.push(`${contextReferenceTag(slot, includeLogo)} = campaign context`);
  }
  return lines.join("\n");
}

function sceneBlock(scene: ConceptScene, style: string, approvedScript: string): string {
  const filmed = sanitizeFilmedSceneFields(scene);
  const heading = `${filmed.startSecond}–${filmed.endSecond} seconds:`;
  const locked =
    filmed.dialogue && filmed.dialogue.trim()
      ? filmed.dialogue.trim()
      : "No spoken words in this scene.";
  if (scene.dialogue?.trim() && !approvedScript.includes(scene.dialogue.trim())) {
    throw new Error("Scene spoken words must match the approved script.");
  }
  return [
    heading,
    "Presenter: the same adult person represented by @Image1, @Image2, @Image3 and @Video1.",
    `Environment: ${filmed.visual}`,
    "Wardrobe: consistent with the presenter references.",
    `Lighting: even and natural, matching a ${style} commercial.`,
    `Action: ${filmed.presenterAction?.trim() || filmed.visual}`,
    `Camera movement: ${filmed.camera}`,
    `Emotional tone: ${style}`,
    `Dialogue (locked, do not rewrite): ${locked}`,
    `Sound: ${filmed.audio?.trim() || "Clear spoken voice over natural room tone."}`,
    SCENE_NO_WRITING_LINE,
    "Continuity: keep the presenter, wardrobe, and setting consistent with the previous shot and the identity references.",
  ].join("\n");
}

export function buildSeedancePrompt(input: SeedancePromptInput): string {
  const approvedScript = input.approvedScript.trim();
  if (!approvedScript) {
    throw new Error("Approve the spoken words before filming your commercial.");
  }
  const aspectRatio: AspectRatio = requireExplicitAspectRatio(input.aspectRatio);
  const durationSeconds = input.durationSeconds;
  if (!isDuration(durationSeconds)) {
    throw new Error(DURATION_CHOICE);
  }
  const style = input.style.trim();
  if (!style) {
    throw new Error("Choose a visual style.");
  }
  const contextSlots = input.contextSlots ?? [];
  const includeLogo = Boolean(input.includeLogo);
  const scenes = [...input.scenes].sort((a, b) => a.startSecond - b.startSecond);

  return [
    IDENTITY_INSTRUCTION,
    "",
    mappingBlock(contextSlots, includeLogo),
    "",
    `Aspect ratio: ${aspectRatio}`,
    `Duration: ${durationSeconds} seconds`,
    `Advertising style: ${style}`,
    "",
    "Locked spoken wording for the full commercial (do not rewrite):",
    approvedScript,
    "",
    ...scenes.flatMap((scene) => [sceneBlock(scene, style, approvedScript), ""]),
    ...(includeLogo ? [LOGO_REFERENCE_INSTRUCTION] : []),
    NO_GENERATED_TEXT_INSTRUCTION,
    BACKGROUND_SIGNAGE_INSTRUCTION,
    NO_SMALL_CTA_INSTRUCTION,
  ]
    .join("\n")
    .trim();
}
