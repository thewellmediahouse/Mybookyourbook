import type { DesignBrief, PriceSummary } from '../../types/designStudio.ts';

export type TeamHandoffPackage = {
  projectId: string;
  publicReference: string;
  status: string;
  paidAt: string | null;
  contact: {
    fullName: string | null;
    email: string | null;
    phone: string | null;
    businessName: string | null;
    preferredTiming: string | null;
    note: string | null;
  };
  brief: Partial<DesignBrief>;
  uploads: Array<{
    id: string;
    kind: string;
    originalFilename: string | null;
    mimeType: string;
    sizeBytes: number;
    assetPath: string;
  }>;
  concepts: Array<{
    id: string;
    slot: number;
    status: string;
    hasImage: boolean;
    imagePath: string | null;
    direction: unknown;
  }>;
  selectedConcept: {
    id: string;
    slot: number;
    direction: unknown;
  } | null;
  order: {
    id: string;
    merchantPaymentId: string;
    status: string;
    currency: string;
    amountCents: number;
    amountZar: number;
    amountFormatted: string;
    payfastPaymentId: string | null;
    verifiedAt: string | null;
    price: PriceSummary | null;
  } | null;
  timeline: {
    createdAt: string;
    generationStartedAt: string | null;
    generationCompletedAt: string | null;
    paidAt: string | null;
    updatedAt: string;
  };
};
