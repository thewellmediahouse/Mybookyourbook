export const PRODUCE_COMMERCIAL = "Produce Commercial";
export const PRODUCING = "Starting production…";
export const LEAVE_PAGE =
  "You can leave this page. We'll notify you when your commercial is ready.";
export const IDENTITY_REQUIRED =
  "Show us who you are in AI Identity before we can film this commercial.";
export const CONSENT_REQUIRED =
  "Confirm your identity consent before we can film this commercial.";
export const CONCEPT_REQUIRED = "Approve a concept before we can film this commercial.";
export const DUPLICATE_PRODUCTION =
  "This commercial is already being produced. You can follow progress on the status page.";
export const CUSTOMER_FAILURE =
  "We couldn't complete this commercial. Your Ad Credit has not been lost.";
export const READY_TITLE = "Your commercial is ready";
export const READY_BODY = "Your Production30 commercial is ready to watch in your studio.";
export const DOWNLOAD_1080P = "Download 1080p";
export const FAILED_TITLE = "We couldn't finish this commercial";

export const TIMELINE = [
  { id: "concept", label: "Concept Approved" },
  { id: "production", label: "Production" },
  { id: "enhancement", label: "Enhancement" },
  { id: "branding", label: "Branding" },
  { id: "delivery", label: "Delivery" },
] as const;

export type TimelineId = (typeof TIMELINE)[number]["id"];

export function timelineState(
  jobStatus: string | null,
): Record<TimelineId, "complete" | "current" | "upcoming"> {
  const order: TimelineId[] = ["concept", "production", "enhancement", "branding", "delivery"];
  let current: TimelineId = "production";
  if (!jobStatus || jobStatus === "PRODUCTION_STARTING" || jobStatus.startsWith("SEEDANCE")) {
    current = "production";
  } else if (jobStatus.startsWith("TOPAZ")) {
    current = "enhancement";
  } else if (jobStatus === "BRANDING") {
    current = "branding";
  } else if (jobStatus === "FINALISING") {
    current = "branding";
  } else if (jobStatus === "COMPLETE") {
    current = "delivery";
  } else if (jobStatus === "FAILED" || jobStatus === "CANCELLED") {
    current = "production";
  }
  const currentIndex = order.indexOf(current);
  const doneThrough = jobStatus === "COMPLETE" ? order.length : currentIndex;
  const result = {} as Record<TimelineId, "complete" | "current" | "upcoming">;
  for (let i = 0; i < order.length; i += 1) {
    const id = order[i];
    if (jobStatus === "COMPLETE") {
      result[id] = "complete";
    } else if (i < doneThrough) {
      result[id] = "complete";
    } else if (i === doneThrough) {
      result[id] = "current";
    } else {
      result[id] = "upcoming";
    }
  }
  result.concept = "complete";
  return result;
}
