import { z } from "zod";
import {
  NO_GENERATED_TEXT_INSTRUCTION,
  neutralizeOnScreenWriting,
  sanitizeFilmedSceneFields,
} from "@/lib/creative/on-screen-text";
import type { CreativeConcept } from "./types";

const sceneSchema = z.object({
  startSecond: z.number(),
  endSecond: z.number(),
  visual: z.string().min(1),
  presenterAction: z.string().nullable(),
  camera: z.string().min(1),
  dialogue: z.string().nullable(),
  audio: z.string().nullable(),
});

export const creativeConceptSchema = z.object({
  title: z.string().min(1),
  hook: z.string().min(1),
  strategy: z.string().min(1),
  spokenScript: z.string().min(1),
  scenes: z.array(sceneSchema).min(1),
  callToAction: z.string().min(1),
  generationPrompt: z.string().min(1),
});

export function parseCreativeConcept(value: unknown): CreativeConcept {
  const parsed = creativeConceptSchema.parse(value);
  return {
    ...parsed,
    generationPrompt: [neutralizeOnScreenWriting(parsed.generationPrompt), NO_GENERATED_TEXT_INSTRUCTION]
      .filter(Boolean)
      .join("\n\n"),
    scenes: parsed.scenes.map((scene) =>
      sanitizeFilmedSceneFields({
        ...scene,
        presenterAction: scene.presenterAction || null,
        dialogue: scene.dialogue || null,
        audio: scene.audio || null,
      }),
    ),
  };
}

export const CREATIVE_CONCEPT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "hook",
    "strategy",
    "spokenScript",
    "scenes",
    "callToAction",
    "generationPrompt",
  ],
  properties: {
    title: { type: "string" },
    hook: { type: "string" },
    strategy: { type: "string" },
    spokenScript: {
      type: "string",
      description: "Full spoken wording the presenter says, including the call to action in speech.",
    },
    callToAction: {
      type: "string",
      description: "Spoken customer action only. Never an on-screen button, caption, or graphic.",
    },
    generationPrompt: {
      type: "string",
      description:
        "Internal filming brief. People, place, light, and action only. Never ask for writing, signs with words, or a visual call to action.",
    },
    scenes: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "startSecond",
          "endSecond",
          "visual",
          "presenterAction",
          "camera",
          "dialogue",
          "audio",
        ],
        properties: {
          startSecond: { type: "number" },
          endSecond: { type: "number" },
          visual: {
            type: "string",
            description:
              "People, place, light, and action only. Never describe writing, signs with words, on-screen text, buttons, captions, or a visual call to action.",
          },
          presenterAction: { type: ["string", "null"] },
          camera: { type: "string" },
          dialogue: { type: ["string", "null"] },
          audio: { type: ["string", "null"] },
        },
      },
    },
  },
};
