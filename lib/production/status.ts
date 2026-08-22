import type { ProjectStatus } from "@/lib/projects/status";

export const JOB_STATUSES = [
  "PRODUCTION_STARTING",
  "SEEDANCE_QUEUED",
  "SEEDANCE_PROCESSING",
  "SEEDANCE_COMPLETE",
  "TOPAZ_PREPARING",
  "TOPAZ_UPLOADING",
  "TOPAZ_PROCESSING",
  "TOPAZ_COMPLETE",
  "BRANDING",
  "FINALISING",
  "COMPLETE",
  "FAILED",
  "CANCELLED",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const IN_FLIGHT_JOB_STATUSES: JobStatus[] = [
  "PRODUCTION_STARTING",
  "SEEDANCE_QUEUED",
  "SEEDANCE_PROCESSING",
  "SEEDANCE_COMPLETE",
  "TOPAZ_PREPARING",
  "TOPAZ_UPLOADING",
  "TOPAZ_PROCESSING",
  "TOPAZ_COMPLETE",
  "BRANDING",
  "FINALISING",
];

export const CUSTOMER_PRODUCTION_STAGE = {
  filming: "Filming Your Commercial",
  enhancing: "Enhancing Your Footage",
  branding: "Adding Your Brand",
  finalising: "Final Checks",
  ready: "Your Commercial Is Ready",
  failed: "We couldn't complete this commercial",
} as const;

export function customerProductionLabel(status: string): string {
  if (status === "COMPLETE") {
    return CUSTOMER_PRODUCTION_STAGE.ready;
  }
  if (status === "FAILED" || status === "CANCELLED") {
    return CUSTOMER_PRODUCTION_STAGE.failed;
  }
  if (status === "BRANDING") {
    return CUSTOMER_PRODUCTION_STAGE.branding;
  }
  if (status === "FINALISING") {
    return CUSTOMER_PRODUCTION_STAGE.finalising;
  }
  if (
    status === "TOPAZ_PREPARING" ||
    status === "TOPAZ_UPLOADING" ||
    status === "TOPAZ_PROCESSING" ||
    status === "TOPAZ_COMPLETE"
  ) {
    return CUSTOMER_PRODUCTION_STAGE.enhancing;
  }
  return CUSTOMER_PRODUCTION_STAGE.filming;
}

export function projectStatusForJob(status: JobStatus): ProjectStatus {
  if (status === "COMPLETE") {
    return "READY";
  }
  if (status === "FAILED" || status === "CANCELLED") {
    return "FAILED";
  }
  if (status === "BRANDING") {
    return "BRANDING";
  }
  if (status === "FINALISING") {
    return "FINALISING";
  }
  if (
    status === "TOPAZ_PREPARING" ||
    status === "TOPAZ_UPLOADING" ||
    status === "TOPAZ_PROCESSING" ||
    status === "TOPAZ_COMPLETE"
  ) {
    return "ENHANCING";
  }
  return "IN_PRODUCTION";
}

export function isInFlightJob(status: string): boolean {
  return (IN_FLIGHT_JOB_STATUSES as string[]).includes(status);
}
