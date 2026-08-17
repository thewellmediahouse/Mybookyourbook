/**
 * PayFast Custom Integration helpers (sandbox-first).
 * Signature rules follow current PayFast docs — attribute order, not alphabetical.
 */

import { md5Hex } from './md5.ts';

/** Checkout field order per PayFast attribute description. */
export const PAYFAST_CHECKOUT_FIELD_ORDER = [
  'merchant_id',
  'merchant_key',
  'return_url',
  'cancel_url',
  'notify_url',
  'name_first',
  'name_last',
  'email_address',
  'cell_number',
  'm_payment_id',
  'amount',
  'item_name',
  'item_description',
  'custom_int1',
  'custom_int2',
  'custom_int3',
  'custom_int4',
  'custom_int5',
  'custom_str1',
  'custom_str2',
  'custom_str3',
  'custom_str4',
  'custom_str5',
  'email_confirmation',
  'confirmation_address',
  'payment_method',
] as const;

export type PayFastMode = 'sandbox' | 'live';

export type PayFastCheckoutFields = Record<string, string>;

/** PHP-style urlencode: spaces as +, hex escapes uppercase. */
export function payfastUrlEncode(value: string): string {
  return encodeURIComponent(value.trim())
    .replace(/%20/g, '+')
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%[0-9a-f]{2}/gi, (match) => match.toUpperCase());
}

export function formatPayfastAmount(zar: number): string {
  return (Math.round(zar * 100) / 100).toFixed(2);
}

/**
 * Generate checkout signature from ordered non-blank fields + optional passphrase.
 */
export function generatePayfastCheckoutSignature(
  fields: PayFastCheckoutFields,
  passphrase?: string | null,
): string {
  const pairs: string[] = [];
  for (const key of PAYFAST_CHECKOUT_FIELD_ORDER) {
    const raw = fields[key];
    if (raw === undefined || raw === null) continue;
    const value = String(raw).trim();
    if (value === '') continue;
    pairs.push(`${key}=${payfastUrlEncode(value)}`);
  }

  let paramString = pairs.join('&');
  const salt = (passphrase || '').trim();
  if (salt) {
    paramString += `&passphrase=${payfastUrlEncode(salt)}`;
  }
  return md5Hex(paramString);
}

/**
 * Verify ITN signature using posted field order (until signature key).
 */
export function verifyPayfastItnSignature(
  posted: Record<string, string>,
  passphrase?: string | null,
): boolean {
  const provided = (posted.signature || '').trim().toLowerCase();
  if (!provided) return false;

  const pairs: string[] = [];
  for (const [key, raw] of Object.entries(posted)) {
    if (key === 'signature') break;
    const value = String(raw ?? '');
    pairs.push(`${key}=${payfastUrlEncode(value)}`);
  }

  let paramString = pairs.join('&');
  const salt = (passphrase || '').trim();
  if (salt) {
    paramString += `&passphrase=${payfastUrlEncode(salt)}`;
  }

  return md5Hex(paramString) === provided;
}

export function payfastProcessUrl(mode: PayFastMode): string {
  const host = mode === 'live' ? 'www.payfast.co.za' : 'sandbox.payfast.co.za';
  return `https://${host}/eng/process`;
}

export function payfastValidateUrl(mode: PayFastMode): string {
  const host = mode === 'live' ? 'www.payfast.co.za' : 'sandbox.payfast.co.za';
  return `https://${host}/eng/query/validate`;
}

export function amountsMatch(expectedZar: number, amountGross: string): boolean {
  const received = Number.parseFloat(amountGross);
  if (!Number.isFinite(received)) return false;
  return Math.abs(expectedZar - received) <= 0.01;
}

/** Strip secrets from ITN payload before logging/storage. */
export function sanitizePayfastPayload(
  posted: Record<string, string>,
): Record<string, string> {
  const safe: Record<string, string> = {};
  for (const [key, value] of Object.entries(posted)) {
    if (key === 'signature' || key === 'merchant_key') continue;
    safe[key] = String(value).slice(0, 500);
  }
  return safe;
}

export async function confirmPayfastServerValidation(input: {
  mode: PayFastMode;
  posted: Record<string, string>;
  fetchImpl?: typeof fetch;
}): Promise<boolean> {
  const fetchFn = input.fetchImpl ?? fetch;
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(input.posted)) {
    body.set(key, value);
  }

  try {
    const response = await fetchFn(payfastValidateUrl(input.mode), {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const text = (await response.text()).trim().toUpperCase();
    return text === 'VALID';
  } catch {
    return false;
  }
}

export function resolvePayfastMode(raw: string | undefined): PayFastMode {
  const mode = (raw || 'sandbox').trim().toLowerCase();
  // Hard guard: never silently default to live.
  if (mode === 'live') return 'live';
  return 'sandbox';
}

export function splitContactName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: 'Customer', last: 'Client' };
  if (parts.length === 1) return { first: parts[0]!, last: 'Client' };
  return { first: parts[0]!, last: parts.slice(1).join(' ') };
}
