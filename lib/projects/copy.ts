export const CREATE_HEADING = "Create Advert";
export const CREATE_BODY =
  "Choose who to film and any extra photos, write your script, approve it, then we film it. We save as you go.";
export const SIMPLE_WIZARD_STEPS = [
  { id: "profile", label: "Profile" },
  { id: "script", label: "Script" },
  { id: "approve", label: "Approve" },
  { id: "generate", label: "Generate" },
] as const;
export const STUDIO_HEADING = "Create your next advert";
export const STUDIO_BODY =
  "Start with a business advert, or make a short viral video starring you. Concept work is free. One Ad Credit starts one new commercial.";
export const STUDIO_KICKER = "AD STUDIO";
export const STUDIO_BUSINESS_HEADING = "Business advert";
export const STUDIO_BUSINESS_BODY =
  "A professional advert for your company, product, or place. You stay on camera.";
export const STUDIO_VIRAL_HEADING = "Viral videos";
export const STUDIO_VIRAL_BODY =
  "Short vertical adverts for Reels and TikTok. Still your business, still you.";
export const STUDIO_PRESET_HEADING = "Start from a look";
export const STUDIO_CONTINUE_DRAFT = "Continue last draft";
export const STUDIO_WEBSITE_HINT =
  "We only copy a title and description the website already publishes. We do not invent an offer.";
export const STUDIO_VIRAL_HINT =
  "Upload stills from the advert you want to remake, plus photos of your product or place. We will not copy someone else's logo or on-screen words.";

export const WIZARD_STEPS = [
  { id: "campaign", label: "Campaign" },
  { id: "goal", label: "Goal" },
  { id: "style", label: "Style" },
  { id: "format", label: "Format" },
  { id: "references", label: "References" },
  { id: "concept", label: "Concept" },
  { id: "approve", label: "Approve", later: true },
  { id: "produce", label: "Produce", later: true },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];
export type SimpleWizardStepId = (typeof SIMPLE_WIZARD_STEPS)[number]["id"];

export function resolveSimpleWizardStep(input: {
  requested?: string;
  profileReady: boolean;
  conceptApproved: boolean;
  hasConcept: boolean;
  briefReady: boolean;
  freshStart?: boolean;
}): number {
  const requested = SIMPLE_WIZARD_STEPS.findIndex((step) => step.id === input.requested);
  if (requested >= 0) {
    return requested;
  }
  if (input.freshStart) {
    return 0;
  }
  if (input.conceptApproved) {
    return 3;
  }
  if (input.hasConcept || input.briefReady) {
    return 2;
  }
  return 0;
}
