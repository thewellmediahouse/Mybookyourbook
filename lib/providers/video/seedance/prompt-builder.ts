import type { ConceptScene } from "@/lib/ai/creative-director";
import { IDENTITY_REFERENCE_MAP } from "@/lib/identity/slots";
import {
  CONTEXT_SLOTS,
  requireExplicitAspectRatio,
  type AspectRatio,
} from "@/lib/projects/brief";

export const IDENTITY_INSTRUCTION =
  "The primary presenter must remain the same adult person represented by @Image1, @Image2, @Image3 and @Video1. Preserve recognisable facial structure, hairstyle, age, skin appearance and body proportions consistently throughout the commercial. Use @Video1 as the primary reference for natural speaking style, facial movement, voice/accent where supported, mannerisms and presentation.";

export const NO_GENERATED_TEXT_INSTRUCTION =
  "Do not generate subtitles, captions, logos, prices, phone numbers, websites, labels, signs, interface text, banners, watermarks or other important readable written text. Do not invent written words. Important branding and written information will be applied accurately in post-production.";

export const BACKGROUND_SIGNAGE_INSTRUCTION =
  "Keep background signage non-prominent and avoid readable invented text.";

/** Internal mapping only. Never shown to customers. Identity uses @Image1–3 and @Video1. */
export const CONTEXT_REFERENCE_MAP: Record<(typeof CONTEXT_SLOTS)[number], string> = {
  CONTEXT_1: "@Image4",
  CONTEXT_2: "@Image5",
  CONTEXT_3: "@Image6",
  CONTEXT_4: "@Image7",
  CONTEXT_5: "@Image8",
  CONTEXT_6: "@Image9",
};

export type SeedancePromptInput = {
  approvedScript: string;
  scenes: ConceptScene[];
  aspectRatio: string;
  durationSeconds: number;
  style: string;
  contextSlots?: string[];
  /** Ignored. Prompt generation must not rewrite approved spoken words. */
  draftScript?: string;
};

function mappingBlock(contextSlots: string[]): string {
  const lines = [
    "Reference mapping:",
    `${IDENTITY_REFERENCE_MAP.IDENTITY_FRONT} = identity front`,
    `${IDENTITY_REFERENCE_MAP.IDENTITY_LEFT} = identity left`,
    `${IDENTITY_REFERENCE_MAP.IDENTITY_RIGHT} = identity right`,
    `${IDENTITY_REFERENCE_MAP.IDENTITY_VIDEO} = presenter video`,
  ];
  const used = CONTEXT_SLOTS.filter((slot) => contextSlots.includes(slot));
  for (const slot of used) {
    lines.push(`${CONTEXT_REFERENCE_MAP[slot]} = campaign context`);
  }
  return lines.join("\n");
}

function sceneBlock(scene: ConceptScene, style: string, approvedScript: string): string {
  const heading = `${scene.startSecond}–${scene.endSecond} seconds:`;
  const locked =
    scene.dialogue && scene.dialogue.trim()
      ? scene.dialogue.trim()
      : "No spoken words in this scene.";
  if (scene.dialogue?.trim() && !approvedScript.includes(scene.dialogue.trim())) {
    throw new Error("Scene spoken words must match the approved script.");
  }
  return [
    heading,
    "Presenter: the same adult person represented by @Image1, @Image2, @Image3 and @Video1.",
    `Environment: ${scene.visual}`,
    "Wardrobe: consistent with the presenter references.",
    `Lighting: even and natural, matching a ${style} commercial.`,
    `Action: ${scene.presenterAction?.trim() || scene.visual}`,
    `Camera movement: ${scene.camera}`,
    `Emotional tone: ${style}`,
    `Dialogue (locked, do not rewrite): ${locked}`,
    `Sound: ${scene.audio?.trim() || "Clear spoken voice over natural room tone."}`,
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
  if (durationSeconds !== 15 && durationSeconds !== 20 && durationSeconds !== 30) {
    throw new Error("Choose 15, 20, or 30 seconds.");
  }
  const style = input.style.trim();
  if (!style) {
    throw new Error("Choose a visual style.");
  }
  const contextSlots = input.contextSlots ?? [];
  const scenes = [...input.scenes].sort((a, b) => a.startSecond - b.startSecond);

  return [
    IDENTITY_INSTRUCTION,
    "",
    mappingBlock(contextSlots),
    "",
    `Aspect ratio: ${aspectRatio}`,
    `Duration: ${durationSeconds} seconds`,
    `Advertising style: ${style}`,
    "",
    "Locked spoken wording for the full commercial (do not rewrite):",
    approvedScript,
    "",
    ...scenes.flatMap((scene) => [sceneBlock(scene, style, approvedScript), ""]),
    NO_GENERATED_TEXT_INSTRUCTION,
    BACKGROUND_SIGNAGE_INSTRUCTION,
  ]
    .join("\n")
    .trim();
}
