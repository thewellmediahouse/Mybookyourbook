import type { CreativeBrief } from "./types";

export function systemPrompt(): string {
  return [
    "You write commercial concepts for small and medium businesses.",
    "Write in plain language a business owner can read.",
    "Do not name vendors, models, codecs, or internal tools.",
    "Do not invent reviews, awards, prices, performance figures, or guarantees.",
    "Respect the industry principles and anything the brief says to avoid.",
    "Scenes must cover the full duration with contiguous start and end seconds.",
    "spokenScript is the full spoken wording the presenter will say, in order.",
    "generationPrompt is an internal filming brief, never shown to the customer.",
    "callToAction must match the brief's requested customer action.",
  ].join(" ");
}

export function userPrompt(input: CreativeBrief): string {
  return [
    `Business: ${input.businessName}`,
    `Industry: ${input.industry || "not specified"}`,
    `Campaign: ${input.campaignTitle}`,
    `Advertising: ${input.advertisingType}`,
    `Audience: ${input.targetCustomer || "not specified"}`,
    `Problem: ${input.problem || "not specified"}`,
    `Why choose them: ${input.valueProposition || "not specified"}`,
    `Offer: ${input.offer || "none"}`,
    `Customer action: ${input.ctaType}${input.ctaValue ? ` (${input.ctaValue})` : ""}`,
    `Style: ${input.style}`,
    `Tone: ${input.tones.length ? input.tones.join(", ") : "not specified"}`,
    `Avoid saying: ${input.avoid || "none"}`,
    `Platform: ${input.platform}`,
    `Aspect ratio: ${input.aspectRatio}`,
    `Duration: ${input.durationSeconds} seconds`,
    `Industry focus: ${input.strategy.focus}`,
    `Industry avoid: ${input.strategy.avoid}`,
  ].join("\n");
}
