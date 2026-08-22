export const CREATE_HEADING = "Create Commercial";
export const CREATE_BODY = "Tell us about this campaign. We save as you go, so you can leave and come back.";

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
