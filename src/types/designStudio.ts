/** Shared Design Studio types — wizard, concepts, orders, uploads. */

export const DESIGN_PROJECT_STATUSES = [
  'DRAFT',
  'READY_TO_GENERATE',
  'GENERATING',
  'GENERATED',
  'CONCEPT_SELECTED',
  'AWAITING_PAYMENT',
  'PAID',
  'READY_FOR_DESIGNER',
  'IN_DESIGN',
  'COMPLETED',
  'CANCELLED',
  'FAILED',
] as const;

export type DesignProjectStatus = (typeof DESIGN_PROJECT_STATUSES)[number];

export type DesignUploadKind =
  | 'logo'
  | 'brand_guide'
  | 'product_photo'
  | 'team_photo'
  | 'reference'
  | 'other';

export type DesignConceptStatus = 'PENDING' | 'GENERATING' | 'READY' | 'FAILED';

export type DesignOrderStatus =
  | 'PENDING'
  | 'AWAITING_PAYMENT'
  | 'PAID'
  | 'CANCELLED'
  | 'FAILED'
  | 'QUOTE_REQUIRED';

export interface ShopDetails {
  productCount?: string;
  productKinds?: string[];
  deliveryRequired?: boolean;
  onlinePaymentRequired?: boolean;
}

export interface DesignBrief {
  businessName: string;
  industry: string;
  customIndustry?: string;
  businessDescription: string;
  existingWebsiteUrl?: string;
  market?: string;
  goals: string[];
  websiteType: string;
  primaryStyle: string;
  secondaryStyle?: string;
  colourMode: string;
  customColours?: string[];
  features: string[];
  shopDetails?: ShopDetails;
  pages: string[];
  customPages?: string[];
  /** Phase 2 local/demo file names before secure upload metadata exists */
  uploadNames?: string[];
  /** Server-backed uploads (R2) once the Design Studio API is available */
  uploadedFiles?: Array<{ id: string; name: string; kind: string }>;
  freeTextBrief: string;
  avoid?: string;
  acceptedTerms?: boolean;
}

/** Research extracted from the visitor's existing website (HTML fetch). */
export interface WebsiteScanBrief {
  url: string;
  title?: string;
  description?: string;
  headings?: string[];
  textSample?: string;
  themeColor?: string;
  logoImported?: boolean;
}

/** Structured brief payload sent to the design strategist model. */
export interface StructuredDesignBrief {
  promptVersion: string;
  business: {
    name: string;
    industry: string;
    description: string;
    existingWebsiteUrl?: string;
    market?: string;
  };
  goals: string[];
  websiteType: string;
  style: {
    primary: string;
    secondary?: string;
  };
  colours: {
    mode: string;
    custom: string[];
  };
  features: string[];
  shopDetails?: ShopDetails;
  pages: string[];
  freeTextBrief: string;
  avoid?: string;
  uploads: Array<{
    kind: DesignUploadKind | 'named_file';
    available: boolean;
    count?: number;
    name?: string;
  }>;
  /** Present when the existing website URL was scanned successfully. */
  websiteScan?: WebsiteScanBrief;
}

export interface ConceptDirection {
  id: string;
  name: string;
  oneLineConcept: string;
  targetFeeling: string[];
  layoutDirection: string;
  heroDirection: string;
  typographyDirection: string;
  colourDirection: string[];
  sectionFlow: string[];
  conversionStrategy: string;
  visualPrompt: string;
  differentiators: string[];
  /** Demo-only visual accent for Phase 2 mockups */
  mockAccent?: string;
  mockPalette?: string[];
  bestFor?: string;
}

export interface ConceptBatch {
  concepts: [
    ConceptDirection,
    ConceptDirection,
    ConceptDirection,
    ConceptDirection,
  ];
}

export interface WizardPersistedState {
  version: 1;
  currentStep: number;
  brief: Partial<DesignBrief>;
  updatedAt: string;
}

export interface PriceSummary {
  currency: 'ZAR';
  websiteType: string;
  amountZar: number | null;
  depositPercent: number;
  payableZar: number | null;
  requiresQuote: boolean;
  label: string;
  lineItems: Array<{ label: string; amountZar: number | null }>;
}

export interface ValidationResult<T> {
  ok: boolean;
  value?: T;
  errors: string[];
}
