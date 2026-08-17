import type { TeamHandoffPackage } from './handoffTypes.ts';

export function formatHandoffEmailBody(handoff: TeamHandoffPackage): string {
  const selectedName =
    (handoff.selectedConcept?.direction as { name?: string } | null)?.name ||
    handoff.selectedConcept?.id ||
    '—';

  return [
    'New Design Studio project ready for the design team.',
    '',
    `Reference: ${handoff.publicReference}`,
    `Project ID: ${handoff.projectId}`,
    `Status: ${handoff.status}`,
    `Paid at: ${handoff.paidAt || '—'}`,
    '',
    'Contact',
    `- Name: ${handoff.contact.fullName || '—'}`,
    `- Email: ${handoff.contact.email || '—'}`,
    `- Phone: ${handoff.contact.phone || '—'}`,
    `- Business: ${handoff.contact.businessName || '—'}`,
    `- Timing: ${handoff.contact.preferredTiming || '—'}`,
    `- Note: ${handoff.contact.note || '—'}`,
    '',
    'Order',
    `- Amount: ${handoff.order?.amountFormatted || '—'}`,
    `- Merchant payment ID: ${handoff.order?.merchantPaymentId || '—'}`,
    `- PayFast payment ID: ${handoff.order?.payfastPaymentId || '—'}`,
    `- Order status: ${handoff.order?.status || '—'}`,
    '',
    'Selected direction',
    `- ${selectedName}`,
    '',
    `Uploads: ${handoff.uploads.length}`,
    `Concepts: ${handoff.concepts.length}`,
    '',
    `Website type: ${handoff.brief.websiteType || '—'}`,
    `Features: ${(handoff.brief.features || []).join(', ') || '—'}`,
    '',
    'Retrieve the full handoff JSON via the internal Design Studio team API.',
  ].join('\n');
}
