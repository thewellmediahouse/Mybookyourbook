import { CREATIVE_CONCEPT_JSON_SCHEMA } from "./schema";
import { systemPrompt, userPrompt } from "./prompt";
import type { CreativeBrief, CreativeConcept, CreativeDirectorProvider } from "./types";

const CUSTOMER_UNAVAILABLE = "We couldn't create a concept right now. Please try again later.";
const CUSTOMER_REFUSED =
  "We couldn't create a concept from that brief. Please change the brief and try again.";
const DEFAULT_MODEL = "gpt-4o-mini";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

type OpenAiEnv = {
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
};

type ResponsePayload = {
  output_text?: unknown;
  error?: { message?: unknown };
  output?: Array<{
    content?: Array<{ type?: string; text?: string; refusal?: string }>;
  }>;
};

function readResponseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    throw new Error(CUSTOMER_UNAVAILABLE);
  }
  const body = payload as ResponsePayload;
  if (body.error) {
    throw new Error(CUSTOMER_UNAVAILABLE);
  }
  if (typeof body.output_text === "string" && body.output_text.trim()) {
    return body.output_text;
  }
  for (const item of body.output ?? []) {
    for (const part of item.content ?? []) {
      if (part.refusal) {
        throw new Error(CUSTOMER_REFUSED);
      }
      if (typeof part.text === "string" && part.text.trim()) {
        return part.text;
      }
    }
  }
  throw new Error(CUSTOMER_UNAVAILABLE);
}

export function createOpenAiCreativeDirector(env: OpenAiEnv): CreativeDirectorProvider {
  const apiKey = env.OPENAI_API_KEY?.trim();
  const model = env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;

  return {
    async generateConcept(input: CreativeBrief): Promise<CreativeConcept> {
      if (!apiKey) {
        throw new Error(CUSTOMER_UNAVAILABLE);
      }
      const response = await fetch(OPENAI_RESPONSES_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          input: [
            { role: "system", content: systemPrompt() },
            { role: "user", content: userPrompt(input) },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "creative_concept",
              strict: true,
              schema: CREATIVE_CONCEPT_JSON_SCHEMA,
            },
          },
        }),
      });
      if (!response.ok) {
        throw new Error(CUSTOMER_UNAVAILABLE);
      }
      const payload: unknown = await response.json();
      const text = readResponseText(payload);
      try {
        return JSON.parse(text) as CreativeConcept;
      } catch {
        throw new Error(CUSTOMER_UNAVAILABLE);
      }
    },
  };
}
