export const PROJECT_STATUSES = [
  "DRAFT",
  "AWAITING_APPROVAL",
  "READY_TO_PRODUCE",
  "IN_PRODUCTION",
  "ENHANCING",
  "BRANDING",
  "FINALISING",
  "READY",
  "FAILED",
  "ARCHIVED",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const CREATE_WIZARD_STATUSES: ProjectStatus[] = [
  "DRAFT",
  "AWAITING_APPROVAL",
  "READY_TO_PRODUCE",
];

export const IN_PRODUCTION_STATUSES: ProjectStatus[] = [
  "IN_PRODUCTION",
  "ENHANCING",
  "BRANDING",
  "FINALISING",
];

export const CUSTOMER_STATUS_LABEL: Record<ProjectStatus, string> = {
  DRAFT: "Draft",
  AWAITING_APPROVAL: "Awaiting Approval",
  READY_TO_PRODUCE: "Ready to Produce",
  IN_PRODUCTION: "In Production",
  ENHANCING: "Enhancing",
  BRANDING: "Branding",
  FINALISING: "Finalising",
  READY: "Ready",
  FAILED: "Failed",
  ARCHIVED: "Archived",
};

export function projectStatusLabel(status: string): string {
  return status in CUSTOMER_STATUS_LABEL
    ? CUSTOMER_STATUS_LABEL[status as ProjectStatus]
    : status;
}

export function isCreateWizardStatus(status: string): boolean {
  return (CREATE_WIZARD_STATUSES as string[]).includes(status);
}

export function isInProductionStatus(status: string): boolean {
  return (IN_PRODUCTION_STATUSES as string[]).includes(status);
}
