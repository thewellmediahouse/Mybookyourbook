import {
  buildTeamHandoff,
  notifyTeamHandoff,
} from '@/server/design-studio/handoff';
import {
  getOrderByMerchantPaymentId,
  markOrderPaid,
  recordPaymentEvent,
} from '@/server/design-studio/orders';
import { getProjectById, updateProjectBrief } from '@/server/design-studio/projects';
import type { DesignStudioEnv } from '@/server/design-studio/types';
import {
  amountsMatch,
  confirmPayfastServerValidation,
  resolvePayfastMode,
  sanitizePayfastPayload,
  verifyPayfastItnSignature,
} from '@/utils/design-studio/payfast';
import { md5Hex } from '@/utils/design-studio/md5';

async function parseFormBody(request: Request): Promise<Record<string, string>> {
  const text = await request.text();
  const posted: Record<string, string> = {};
  // Preserve insertion order from the raw body for signature verification.
  for (const part of text.split('&')) {
    if (!part) continue;
    const eq = part.indexOf('=');
    const rawKey = eq >= 0 ? part.slice(0, eq) : part;
    const rawVal = eq >= 0 ? part.slice(eq + 1) : '';
    const key = decodeURIComponent(rawKey.replace(/\+/g, ' '));
    const value = decodeURIComponent(rawVal.replace(/\+/g, ' '));
    if (key && !(key in posted)) {
      posted[key] = value;
    }
  }
  return posted;
}

/**
 * POST /api/design-studio/payfast-notify
 * Instant Transaction Notification — only verified ITN marks paid.
 * Return URL must never call this logic.
 */
export async function handlePayfastNotify(
  request: Request,
  env: DesignStudioEnv,
): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Acknowledge quickly-friendly 200; still process verification first for correctness.
  const mode = resolvePayfastMode(env.PAYFAST_MODE);
  const passphrase = (env.PAYFAST_PASSPHRASE || '').trim();
  let posted: Record<string, string>;

  try {
    posted = await parseFormBody(request);
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  const safePayload = sanitizePayfastPayload(posted);
  const merchantPaymentId = (posted.m_payment_id || '').trim();
  const pfPaymentId = (posted.pf_payment_id || '').trim() || null;
  const paymentStatus = (posted.payment_status || '').trim().toUpperCase();

  if (!merchantPaymentId) {
    console.error('payfast-notify missing m_payment_id', safePayload);
    return new Response('Missing m_payment_id', { status: 400 });
  }

  const order = await getOrderByMerchantPaymentId(env, merchantPaymentId);
  if (!order) {
    console.error('payfast-notify unknown order', merchantPaymentId);
    return new Response('Order not found', { status: 404 });
  }

  // Idempotent short-circuit for already-paid orders.
  if (order.status === 'PAID') {
    await recordPaymentEvent(env, {
      orderId: order.id,
      eventType: 'itn_duplicate_paid',
      providerReference: pfPaymentId,
      payloadHash: md5Hex(JSON.stringify(safePayload)),
      safePayload,
    });
    return new Response('OK', { status: 200 });
  }

  const signatureOk = verifyPayfastItnSignature(posted, passphrase || null);
  if (!signatureOk) {
    await recordPaymentEvent(env, {
      orderId: order.id,
      eventType: 'itn_invalid_signature',
      providerReference: pfPaymentId,
      safePayload,
    });
    console.error('payfast-notify invalid signature', merchantPaymentId);
    return new Response('Invalid signature', { status: 400 });
  }

  const expectedZar = order.amount_cents / 100;
  if (!amountsMatch(expectedZar, posted.amount_gross || '')) {
    await recordPaymentEvent(env, {
      orderId: order.id,
      eventType: 'itn_amount_mismatch',
      providerReference: pfPaymentId,
      safePayload: { ...safePayload, expectedZar: String(expectedZar) },
    });
    console.error('payfast-notify amount mismatch', merchantPaymentId, posted.amount_gross);
    return new Response('Amount mismatch', { status: 400 });
  }

  const serverValid = await confirmPayfastServerValidation({ mode, posted });
  if (!serverValid) {
    await recordPaymentEvent(env, {
      orderId: order.id,
      eventType: 'itn_server_invalid',
      providerReference: pfPaymentId,
      safePayload,
    });
    console.error('payfast-notify server validation failed', merchantPaymentId);
    return new Response('Invalid', { status: 400 });
  }

  if (paymentStatus !== 'COMPLETE') {
    await recordPaymentEvent(env, {
      orderId: order.id,
      eventType: `itn_status_${paymentStatus || 'unknown'}`.toLowerCase(),
      providerReference: pfPaymentId,
      safePayload,
    });
    // Non-complete statuses are acknowledged so PayFast stops retrying incorrectly.
    return new Response('OK', { status: 200 });
  }

  const eventResult = await recordPaymentEvent(env, {
    orderId: order.id,
    eventType: 'itn_complete',
    providerReference: pfPaymentId || merchantPaymentId,
    payloadHash: md5Hex(JSON.stringify(safePayload)),
    safePayload,
  });

  // Always fulfill payment if still unpaid — covers crash-after-event and racing workers.
  const latestOrder = await getOrderByMerchantPaymentId(env, merchantPaymentId);
  if (latestOrder && latestOrder.status !== 'PAID') {
    await markOrderPaid(env, {
      orderId: latestOrder.id,
      payfastPaymentId: pfPaymentId,
    });

    const project = await getProjectById(env, latestOrder.project_id);
    if (project) {
      const now = new Date().toISOString();
      try {
        if (project.status === 'AWAITING_PAYMENT' || project.status === 'CONCEPT_SELECTED') {
          await updateProjectBrief(env, project.id, {}, { status: 'PAID' });
        }
        const refreshed = await getProjectById(env, project.id);
        if (refreshed?.status === 'PAID') {
          await updateProjectBrief(env, project.id, {}, { status: 'READY_FOR_DESIGNER' });
        }
        await env.DESIGN_STUDIO_DB.prepare(
          `UPDATE design_projects SET paid_at = COALESCE(paid_at, ?), updated_at = ? WHERE id = ?`,
        )
          .bind(now, now, project.id)
          .run();
      } catch (error) {
        console.error(
          'payfast-notify project transition failed',
          project.id,
          error instanceof Error ? error.message : 'unknown',
        );
      }
    }

    if (eventResult === 'inserted') {
      await recordPaymentEvent(env, {
        orderId: latestOrder.id,
        eventType: 'order_marked_paid',
        providerReference: pfPaymentId,
        safePayload: { merchantPaymentId, projectId: latestOrder.project_id },
      });

      // Best-effort team handoff notification — never fail the ITN response.
      try {
        const handoff = await buildTeamHandoff(env, latestOrder.project_id);
        if (handoff) {
          const notify = await notifyTeamHandoff(env, handoff);
          await recordPaymentEvent(env, {
            orderId: latestOrder.id,
            eventType: notify.sent ? 'team_handoff_notified' : 'team_handoff_notify_skipped',
            providerReference: pfPaymentId,
            safePayload: {
              sent: String(notify.sent),
              reason: notify.reason || '',
              publicReference: handoff.publicReference,
            },
          });
        }
      } catch (error) {
        console.error(
          'team handoff notify failed',
          latestOrder.project_id,
          error instanceof Error ? error.message : 'unknown',
        );
      }
    }
  }

  return new Response('OK', { status: 200 });
}
