import type { DesignStudioEnv } from '@/server/design-studio/types';
import type { PriceSummary } from '@/types/designStudio';

export type DesignOrderRow = {
  id: string;
  project_id: string;
  merchant_payment_id: string;
  status: string;
  currency: string;
  amount_cents: number;
  price_breakdown_json: string;
  payfast_payment_id: string | null;
  created_at: string;
  updated_at: string;
  verified_at: string | null;
};

export type PublicDesignOrder = {
  id: string;
  projectId: string;
  merchantPaymentId: string;
  status: string;
  currency: string;
  amountCents: number;
  amountZar: number;
  price: PriceSummary | null;
  payfastPaymentId: string | null;
  createdAt: string;
  verifiedAt: string | null;
};

function toPublicOrder(row: DesignOrderRow): PublicDesignOrder {
  let price: PriceSummary | null = null;
  try {
    price = JSON.parse(row.price_breakdown_json || 'null') as PriceSummary | null;
  } catch {
    price = null;
  }
  return {
    id: row.id,
    projectId: row.project_id,
    merchantPaymentId: row.merchant_payment_id,
    status: row.status,
    currency: row.currency,
    amountCents: row.amount_cents,
    amountZar: row.amount_cents / 100,
    price,
    payfastPaymentId: row.payfast_payment_id,
    createdAt: row.created_at,
    verifiedAt: row.verified_at,
  };
}

export async function getOrderByMerchantPaymentId(
  env: DesignStudioEnv,
  merchantPaymentId: string,
): Promise<DesignOrderRow | null> {
  return (
    (await env.DESIGN_STUDIO_DB.prepare(
      `SELECT * FROM design_orders WHERE merchant_payment_id = ? LIMIT 1`,
    )
      .bind(merchantPaymentId)
      .first<DesignOrderRow>()) ?? null
  );
}

export async function getLatestOpenOrderForProject(
  env: DesignStudioEnv,
  projectId: string,
): Promise<DesignOrderRow | null> {
  return (
    (await env.DESIGN_STUDIO_DB.prepare(
      `SELECT * FROM design_orders
       WHERE project_id = ?
         AND status IN ('PENDING', 'AWAITING_PAYMENT')
       ORDER BY created_at DESC
       LIMIT 1`,
    )
      .bind(projectId)
      .first<DesignOrderRow>()) ?? null
  );
}

export async function createOrReuseOrder(
  env: DesignStudioEnv,
  input: {
    projectId: string;
    publicReference: string;
    price: PriceSummary;
    payableZar: number;
  },
): Promise<DesignOrderRow> {
  const existing = await getLatestOpenOrderForProject(env, input.projectId);
  const amountCents = Math.round(input.payableZar * 100);
  const now = new Date().toISOString();

  if (existing && existing.amount_cents === amountCents) {
    await env.DESIGN_STUDIO_DB.prepare(
      `UPDATE design_orders
       SET status = 'AWAITING_PAYMENT',
           price_breakdown_json = ?,
           updated_at = ?
       WHERE id = ?`,
    )
      .bind(JSON.stringify(input.price), now, existing.id)
      .run();
    return (await getOrderByMerchantPaymentId(env, existing.merchant_payment_id))!;
  }

  const id = crypto.randomUUID();
  const merchantPaymentId = `WM-${input.publicReference}-${crypto.randomUUID().slice(0, 8)}`;

  await env.DESIGN_STUDIO_DB.prepare(
    `INSERT INTO design_orders (
      id, project_id, merchant_payment_id, status, currency,
      amount_cents, price_breakdown_json, created_at, updated_at
    ) VALUES (?, ?, ?, 'AWAITING_PAYMENT', 'ZAR', ?, ?, ?, ?)`,
  )
    .bind(
      id,
      input.projectId,
      merchantPaymentId,
      amountCents,
      JSON.stringify(input.price),
      now,
      now,
    )
    .run();

  const created = await getOrderByMerchantPaymentId(env, merchantPaymentId);
  if (!created) throw new Error('ORDER_CREATE_FAILED');
  return created;
}

export async function markOrderPaid(
  env: DesignStudioEnv,
  input: {
    orderId: string;
    payfastPaymentId: string | null;
  },
): Promise<DesignOrderRow | null> {
  const now = new Date().toISOString();
  await env.DESIGN_STUDIO_DB.prepare(
    `UPDATE design_orders
     SET status = 'PAID',
         payfast_payment_id = COALESCE(?, payfast_payment_id),
         verified_at = COALESCE(verified_at, ?),
         updated_at = ?
     WHERE id = ?`,
  )
    .bind(input.payfastPaymentId, now, now, input.orderId)
    .run();

  return (
    (await env.DESIGN_STUDIO_DB.prepare(
      `SELECT * FROM design_orders WHERE id = ? LIMIT 1`,
    )
      .bind(input.orderId)
      .first<DesignOrderRow>()) ?? null
  );
}

export async function recordPaymentEvent(
  env: DesignStudioEnv,
  input: {
    orderId: string;
    eventType: string;
    providerReference?: string | null;
    payloadHash?: string | null;
    safePayload: Record<string, unknown>;
  },
): Promise<'inserted' | 'duplicate'> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  try {
    await env.DESIGN_STUDIO_DB.prepare(
      `INSERT INTO payment_events (
        id, order_id, event_type, provider, provider_reference,
        payload_hash, safe_payload_json, created_at
      ) VALUES (?, ?, ?, 'payfast', ?, ?, ?, ?)`,
    )
      .bind(
        id,
        input.orderId,
        input.eventType,
        input.providerReference ?? null,
        input.payloadHash ?? null,
        JSON.stringify(input.safePayload),
        now,
      )
      .run();
    return 'inserted';
  } catch {
    return 'duplicate';
  }
}

export { toPublicOrder };
