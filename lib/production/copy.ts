export const PRODUCE_COMMERCIAL = "Produce Commercial";
export const PRODUCING = "Starting production…";
export const LEAVE_PAGE =
  "You can leave this page. We'll notify you when your commercial is ready.";
export const IDENTITY_REQUIRED =
  "Add your selfie video and face photos to Reference Profile before we can film this commercial.";
export const IDENTITY_UPLOAD_REQUIRED =
  "Add a selfie video and front, left, and right face photos for this advert, then continue.";
export const CONSENT_REQUIRED =
  "Confirm your identity consent before we can film this commercial.";
export const CONCEPT_REQUIRED = "Approve a concept before we can film this commercial.";
export const DUPLICATE_PRODUCTION =
  "This commercial is already being produced. You can follow progress on the status page.";
export const CUSTOMER_FAILURE =
  "We couldn't complete this commercial. Your Ad Credit has not been lost.";
export const CUSTOMER_FAILURE_CHARGED =
  "We couldn't finish this commercial. Filming was already charged, so this used your Ad Credit.";
export const REFERENCE_VIDEO_FORMAT =
  "Your selfie video needs to be a movie file from your phone camera or Upload Video. Record again or upload a new clip, then produce the commercial again.";
export const READY_TITLE = "Your commercial is ready";
export const READY_BODY = "Your Production30 commercial is ready to watch in your studio.";
export const DOWNLOAD_COMMERCIAL = "Download";
export const FAILED_TITLE = "We couldn't finish this commercial";

export const TIMELINE = [
  { id: "concept", label: "Concept Approved" },
  { id: "production", label: "Production" },
  { id: "enhancement", label: "Enhancement" },
  { id: "branding", label: "Branding" },
  { id: "delivery", label: "Delivery" },
] as const;

export type TimelineId = (typeof TIMELINE)[number]["id"];

export const CUSTOMER_PROGRESS = [
  { id: "concept", label: "Script approved", percent: 15 },
  { id: "production", label: "Filming Your Commercial", percent: 40 },
  { id: "enhancement", label: "Enhancing Your Footage", percent: 65 },
  { id: "branding", label: "Adding Your Brand", percent: 85 },
  { id: "delivery", label: "Ready", percent: 100 },
] as const;

export function productionProgressPercent(jobStatus: string | null): number {
  if (!jobStatus) {
    return 15;
  }
  const state = timelineState(jobStatus);
  if (jobStatus === "COMPLETE") {
    return 100;
  }
  if (jobStatus === "FAILED" || jobStatus === "CANCELLED") {
    return 0;
  }
  const current = CUSTOMER_PROGRESS.find((item) => state[item.id] === "current");
  return current?.percent ?? 15;
}

export function productionProgressLabel(jobStatus: string | null): string {
  if (!jobStatus) {
    return "Ready to film";
  }
  if (jobStatus === "COMPLETE") {
    return "Your commercial is ready.";
  }
  if (jobStatus === "FAILED" || jobStatus === "CANCELLED") {
    return "We could not finish this commercial.";
  }
  const state = timelineState(jobStatus);
  const current = CUSTOMER_PROGRESS.find((item) => state[item.id] === "current");
  return current?.label ?? "Filming Your Commercial";
}

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
