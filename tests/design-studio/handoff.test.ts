import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatHandoffEmailBody } from '../../src/utils/design-studio/handoffFormat.ts';
import type { TeamHandoffPackage } from '../../src/utils/design-studio/handoffTypes.ts';

const sample: TeamHandoffPackage = {
  projectId: 'proj-1',
  publicReference: 'WM-ABC123',
  status: 'READY_FOR_DESIGNER',
  paidAt: '2026-07-16T12:00:00.000Z',
  contact: {
    fullName: 'Schalk Brits',
    email: 'schalk@example.com',
    phone: '0825548983',
    businessName: 'Harbour Lights',
    preferredTiming: 'Within 2 weeks',
    note: 'Prefer WhatsApp',
  },
  brief: {
    websiteType: 'Static business website',
    features: ['Contact form', 'WhatsApp'],
  },
  uploads: [],
  concepts: [],
  selectedConcept: {
    id: 'c1',
    slot: 1,
    direction: { name: 'Coastal Editorial' },
  },
  order: {
    id: 'ord-1',
    merchantPaymentId: 'WM-ABC123-deadbeef',
    status: 'PAID',
    currency: 'ZAR',
    amountCents: 700000,
    amountZar: 7000,
    amountFormatted: 'R7 000',
    payfastPaymentId: 'pf-1',
    verifiedAt: '2026-07-16T12:00:00.000Z',
    price: null,
  },
  timeline: {
    createdAt: '2026-07-16T10:00:00.000Z',
    generationStartedAt: null,
    generationCompletedAt: null,
    paidAt: '2026-07-16T12:00:00.000Z',
    updatedAt: '2026-07-16T12:00:00.000Z',
  },
};

describe('team handoff', () => {
  it('formats a readable handoff email body', () => {
    const body = formatHandoffEmailBody(sample);
    assert.match(body, /WM-ABC123/);
    assert.match(body, /READY_FOR_DESIGNER/);
    assert.match(body, /Schalk Brits/);
    assert.match(body, /Coastal Editorial/);
    assert.match(body, /Harbour Lights/);
  });
});
