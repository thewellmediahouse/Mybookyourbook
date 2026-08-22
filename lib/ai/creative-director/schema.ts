import { z } from "zod";
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
    scenes: parsed.scenes.map((scene) => ({
      ...scene,
      presenterAction: scene.presenterAction || null,
      dialogue: scene.dialogue || null,
      audio: scene.audio || null,
    })),
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
    spokenScript: { type: "string" },
    callToAction: { type: "string" },
    generationPrompt: { type: "string" },
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
          visual: { type: "string" },
          presenterAction: { type: ["string", "null"] },
          camera: { type: "string" },
          dialogue: { type: ["string", "null"] },
          audio: { type: ["string", "null"] },
        },
      },
    },
  },
};
