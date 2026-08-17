import { listConceptsForProject } from '@/server/design-studio/concepts';
import { projectHasContact } from '@/server/design-studio/contact';
import {
  authorizeProjectAccess,
  getPublicProject,
} from '@/server/design-studio/projects';
import type { DesignStudioEnv } from '@/server/design-studio/types';
import type { DesignBrief, PriceSummary } from '@/types/designStudio';
import { calculatePriceSummary, formatZar } from '@/utils/design-studio/pricing';

export type CheckoutSummary = {
  projectId: string;
  publicReference: string;
  status: string;
  selectedConceptId: string;
  selectedConceptName: string;
  selectedConceptBlurb: string;
  websiteType: string;
  features: string[];
  price: PriceSummary;
  formatted: {
    amount: string;
    payable: string;
  };
  hasContact: boolean;
  contact: {
    fullName: string | null;
    email: string | null;
    phone: string | null;
    businessName: string | null;
    preferredTiming: string | null;
    note: string | null;
  };
  afterPaymentNote: string;
  checkoutMode: 'pay' | 'quote';
};

/**
 * Build a server-authoritative checkout summary.
 * Never accepts browser-supplied amounts.
 */
export async function buildCheckoutSummary(
  env: DesignStudioEnv,
  input: {
    projectId: string;
    accessToken: string;
  },
): Promise<CheckoutSummary> {
  const authorized = await authorizeProjectAccess(
    env,
    input.projectId,
    input.accessToken,
  );
  if (!authorized) {
    throw new Error('UNAUTHORIZED');
  }

  if (!authorized.selected_concept_id) {
    throw new Error('NO_SELECTION');
  }

  if (
    authorized.status !== 'CONCEPT_SELECTED' &&
    authorized.status !== 'AWAITING_PAYMENT' &&
    authorized.status !== 'PAID' &&
    authorized.status !== 'READY_FOR_DESIGNER'
  ) {
    throw new Error('INVALID_STATE');
  }

  let brief: DesignBrief = {} as DesignBrief;
  try {
    brief = JSON.parse(authorized.brief_json || '{}') as DesignBrief;
  } catch {
    brief = {} as DesignBrief;
  }

  const concepts = await listConceptsForProject(env, input.projectId);
  const selected = concepts.find((c) => c.id === authorized.selected_concept_id);
  if (!selected) {
    throw new Error('CONCEPT_NOT_FOUND');
  }

  const price = calculatePriceSummary({
    websiteType: brief.websiteType || authorized.website_type || '',
    features: brief.features || [],
  });

  const publicProject = getPublicProject(authorized);

  return {
    projectId: authorized.id,
    publicReference: authorized.public_reference,
    status: authorized.status,
    selectedConceptId: selected.id,
    selectedConceptName: selected.direction.name || 'Selected direction',
    selectedConceptBlurb: selected.direction.oneLineConcept || '',
    websiteType: price.websiteType,
    features: brief.features || [],
    price,
    formatted: {
      amount: formatZar(price.amountZar),
      payable: formatZar(price.payableZar),
    },
    hasContact: projectHasContact(publicProject),
    contact: {
      fullName: authorized.contact_name,
      email: authorized.contact_email,
      phone: authorized.contact_phone,
      businessName: authorized.business_name,
      preferredTiming: authorized.preferred_timing,
      note: authorized.designer_note,
    },
    afterPaymentNote: price.requiresQuote
      ? 'Our team will review your brief and send a final quote before any payment.'
      : 'After payment, your brief, uploads, and chosen direction are handed to our design team to build professionally.',
    checkoutMode: price.requiresQuote ? 'quote' : 'pay',
  };
}
