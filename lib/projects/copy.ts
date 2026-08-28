export const CREATE_HEADING = "Create Commercial";
export const CREATE_BODY = "Tell us about this campaign. We save as you go, so you can leave and come back.";
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
