import type { DesignProjectStatus } from '@/types/designStudio';

/** Allowed status transitions for Design Studio projects. */
export const PROJECT_STATUS_TRANSITIONS: Record<DesignProjectStatus, DesignProjectStatus[]> = {
  DRAFT: ['READY_TO_GENERATE', 'CANCELLED'],
  READY_TO_GENERATE: ['GENERATING', 'DRAFT', 'CANCELLED'],
  GENERATING: ['GENERATED', 'FAILED', 'CANCELLED'],
  GENERATED: ['CONCEPT_SELECTED', 'FAILED', 'CANCELLED'],
  CONCEPT_SELECTED: ['AWAITING_PAYMENT', 'CANCELLED'],
  AWAITING_PAYMENT: ['PAID', 'CANCELLED', 'FAILED'],
  PAID: ['READY_FOR_DESIGNER'],
  READY_FOR_DESIGNER: ['IN_DESIGN', 'CANCELLED'],
  IN_DESIGN: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  FAILED: ['READY_TO_GENERATE', 'CANCELLED'],
};

export function canTransitionProjectStatus(
  from: DesignProjectStatus,
  to: DesignProjectStatus,
): boolean {
  return PROJECT_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertProjectStatusTransition(
  from: DesignProjectStatus,
  to: DesignProjectStatus,
): void {
  if (!canTransitionProjectStatus(from, to)) {
    throw new Error(`Invalid project status transition: ${from} → ${to}`);
  }
}
