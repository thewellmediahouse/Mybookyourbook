import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  calculatePriceSummaryFromConfig,
  formatWizardPriceEstimate,
  formatZar,
} from '../../src/utils/design-studio/pricingCore.ts';
import { validateContactInput } from '../../src/utils/design-studio/validateContact.ts';

const pricing = {
  currency: 'ZAR' as const,
  staticWebsitePriceZar: 7000,
  websiteWithShopPriceZar: 15000,
  onlineShopFromZar: 10000,
  onlineShopToZar: 15000,
  depositPercent: 100,
};

const customScope = new Set(['Custom web application', 'Membership/client portal']);

describe('pricing + contact validation', () => {
  it('prices a static business website from config', () => {
    const summary = calculatePriceSummaryFromConfig(
      {
        websiteType: 'Static business website',
        features: ['Contact form', 'WhatsApp'],
      },
      pricing,
      customScope,
    );
    assert.equal(summary.requiresQuote, false);
    assert.equal(summary.currency, 'ZAR');
    assert.equal(summary.amountZar, 7000);
    assert.equal(summary.payableZar, 7000);
    assert.match(summary.label, /website/i);
  });

  it('prices website + online shop when shop feature is selected', () => {
    const summary = calculatePriceSummaryFromConfig(
      {
        websiteType: 'Static business website',
        features: ['Online shop'],
      },
      pricing,
      customScope,
    );
    assert.equal(summary.amountZar, 15000);
    assert.equal(summary.requiresQuote, false);
  });

  it('formats a wizard estimate range for online shop packages', () => {
    const estimate = formatWizardPriceEstimate(
      {
        websiteType: 'Static business website',
        features: ['Online shop'],
      },
      pricing,
      customScope,
    );
    assert.match(estimate.headline, /R10\s*000/);
    assert.match(estimate.headline, /R15\s*000/);
  });

  it('requires quote for custom portals/apps', () => {
    const summary = calculatePriceSummaryFromConfig(
      {
        websiteType: 'Custom web application',
        features: ['Client portal'],
      },
      pricing,
      customScope,
    );
    assert.equal(summary.requiresQuote, true);
    assert.equal(summary.amountZar, null);
    assert.equal(summary.payableZar, null);
    assert.equal(formatZar(null), 'Quote required');
  });

  it('validates required contact fields', () => {
    const bad = validateContactInput({
      fullName: 'A',
      email: 'not-an-email',
      phone: '123',
      businessName: '',
    });
    assert.equal(bad.ok, false);

    const good = validateContactInput({
      fullName: 'Schalk Brits',
      email: 'schalk@example.com',
      phone: '082 554 8983',
      businessName: 'Harbour Lights',
      preferredTiming: 'Within 2 weeks',
      note: 'Prefer WhatsApp',
    });
    assert.equal(good.ok, true);
    if (good.ok) {
      assert.equal(good.value.email, 'schalk@example.com');
      assert.equal(good.value.preferredTiming, 'Within 2 weeks');
    }
  });
});
