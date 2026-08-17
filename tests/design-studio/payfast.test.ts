import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { md5Hex } from '../../src/utils/design-studio/md5.ts';
import {
  amountsMatch,
  formatPayfastAmount,
  generatePayfastCheckoutSignature,
  payfastUrlEncode,
  resolvePayfastMode,
  sanitizePayfastPayload,
  verifyPayfastItnSignature,
} from '../../src/utils/design-studio/payfast.ts';

describe('payfast helpers', () => {
  it('md5Hex matches known digests', () => {
    assert.equal(md5Hex(''), 'd41d8cd98f00b204e9800998ecf8427e');
    assert.equal(md5Hex('hello'), '5d41402abc4b2a76b9719d911017c592');
  });

  it('encodes like PHP urlencode for PayFast', () => {
    assert.equal(payfastUrlEncode('http://example.com/a b'), 'http%3A%2F%2Fexample.com%2Fa+b');
  });

  it('formats amounts with two decimals', () => {
    assert.equal(formatPayfastAmount(7000), '7000.00');
    assert.equal(formatPayfastAmount(15000.5), '15000.50');
  });

  it('generates a stable checkout signature for ordered fields', () => {
    const fields = {
      merchant_id: '10000100',
      merchant_key: '46f0cd694581a',
      return_url: 'https://example.com/return',
      cancel_url: 'https://example.com/cancel',
      notify_url: 'https://example.com/notify',
      name_first: 'Test',
      name_last: 'User',
      email_address: 'test@example.com',
      m_payment_id: 'WM-TEST-1',
      amount: '7000.00',
      item_name: 'Website direction',
    };
    const sig = generatePayfastCheckoutSignature(fields, 'jt7NOE43FZPn');
    assert.match(sig, /^[a-f0-9]{32}$/);
    assert.equal(generatePayfastCheckoutSignature(fields, 'jt7NOE43FZPn'), sig);
  });

  it('verifies ITN signatures built from posted order', () => {
    const posted = {
      m_payment_id: 'WM-TEST-1',
      pf_payment_id: '123456',
      payment_status: 'COMPLETE',
      amount_gross: '7000.00',
      amount_fee: '161.00',
      amount_net: '6839.00',
    };
    // Build signature the same way verify does, then attach it.
    const pairs = Object.entries(posted).map(
      ([k, v]) => `${k}=${payfastUrlEncode(v)}`,
    );
    const param = `${pairs.join('&')}&passphrase=${payfastUrlEncode('secret')}`;
    const signature = md5Hex(param);
    const withSig = { ...posted, signature };
    assert.equal(verifyPayfastItnSignature(withSig, 'secret'), true);
    assert.equal(verifyPayfastItnSignature(withSig, 'wrong'), false);
  });

  it('compares amounts within 1 cent and strips secrets from logs', () => {
    assert.equal(amountsMatch(7000, '7000.00'), true);
    assert.equal(amountsMatch(7000, '7000.02'), false);
    const safe = sanitizePayfastPayload({
      m_payment_id: 'x',
      signature: 'abc',
      merchant_key: 'secret',
      amount_gross: '10.00',
    });
    assert.equal(safe.signature, undefined);
    assert.equal(safe.merchant_key, undefined);
    assert.equal(safe.amount_gross, '10.00');
  });

  it('defaults PayFast mode to sandbox', () => {
    assert.equal(resolvePayfastMode(undefined), 'sandbox');
    assert.equal(resolvePayfastMode('SANDBOX'), 'sandbox');
    assert.equal(resolvePayfastMode('live'), 'live');
  });
});
