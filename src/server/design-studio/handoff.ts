import { listConceptsForProject } from '@/server/design-studio/concepts';
import { getProjectById, getPublicProject } from '@/server/design-studio/projects';
import type { DesignStudioEnv } from '@/server/design-studio/types';
import { listActiveUploads } from '@/server/design-studio/uploads';
import type { DesignBrief, PriceSummary } from '@/types/designStudio';
import { formatHandoffEmailBody } from '@/utils/design-studio/handoffFormat';
import type { TeamHandoffPackage } from '@/utils/design-studio/handoffTypes';
import { formatZar } from '@/utils/design-studio/pricingCore';

export type { TeamHandoffPackage };
export { formatHandoffEmailBody };

export type TeamProjectListItem = {
  id: string;
  publicReference: string;
  status: string;
  businessName: string | null;
  contactName: string | null;
  contactEmail: string | null;
  selectedConceptId: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listTeamProjects(
  env: DesignStudioEnv,
  statusFilter?: string | null,
): Promise<TeamProjectListItem[]> {
  const allowed = new Set([
    'AWAITING_PAYMENT',
    'PAID',
    'READY_FOR_DESIGNER',
    'IN_DESIGN',
    'COMPLETED',
  ]);

  let query = `SELECT id, public_reference, status, business_name, contact_name,
                      contact_email, selected_concept_id, paid_at, created_at, updated_at
               FROM design_projects`;
  const binds: string[] = [];

  if (statusFilter && allowed.has(statusFilter)) {
    query += ` WHERE status = ?`;
    binds.push(statusFilter);
  } else {
    query += ` WHERE status IN ('AWAITING_PAYMENT', 'PAID', 'READY_FOR_DESIGNER', 'IN_DESIGN', 'COMPLETED')`;
  }

  query += ` ORDER BY updated_at DESC LIMIT 100`;

  const result = binds.length
    ? await env.DESIGN_STUDIO_DB.prepare(query).bind(...binds).all()
    : await env.DESIGN_STUDIO_DB.prepare(query).all();

  return (result.results ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      publicReference: String(r.public_reference),
      status: String(r.status),
      businessName: (r.business_name as string | null) ?? null,
      contactName: (r.contact_name as string | null) ?? null,
      contactEmail: (r.contact_email as string | null) ?? null,
      selectedConceptId: (r.selected_concept_id as string | null) ?? null,
      paidAt: (r.paid_at as string | null) ?? null,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    };
  });
}

export async function buildTeamHandoff(
  env: DesignStudioEnv,
  projectId: string,
): Promise<TeamHandoffPackage | null> {
  const project = await getProjectById(env, projectId);
  if (!project) return null;

  const publicProject = getPublicProject(project);
  const [uploads, concepts, orderRow] = await Promise.all([
    listActiveUploads(env, projectId),
    listConceptsForProject(env, projectId),
    env.DESIGN_STUDIO_DB.prepare(
      `SELECT * FROM design_orders
       WHERE project_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
    )
      .bind(projectId)
      .first<{
        id: string;
        merchant_payment_id: string;
        status: string;
        currency: string;
        amount_cents: number;
        price_breakdown_json: string;
        payfast_payment_id: string | null;
        verified_at: string | null;
      }>(),
  ]);

  let brief: Partial<DesignBrief> = {};
  try {
    brief = (publicProject.brief || {}) as Partial<DesignBrief>;
  } catch {
    brief = {};
  }

  let price: PriceSummary | null = null;
  if (orderRow?.price_breakdown_json) {
    try {
      price = JSON.parse(orderRow.price_breakdown_json) as PriceSummary;
    } catch {
      price = null;
    }
  }

  const selected =
    concepts.find((c) => c.id === project.selected_concept_id) || null;

  return {
    projectId: project.id,
    publicReference: project.public_reference,
    status: project.status,
    paidAt: project.paid_at,
    contact: {
      fullName: project.contact_name,
      email: project.contact_email,
      phone: project.contact_phone,
      businessName: project.business_name,
      preferredTiming: project.preferred_timing,
      note: project.designer_note,
    },
    brief,
    uploads: uploads.map((u) => ({
      id: u.id,
      kind: u.kind,
      originalFilename: u.originalFilename,
      mimeType: u.mimeType,
      sizeBytes: u.sizeBytes,
      assetPath: u.assetPath,
    })),
    concepts: concepts.map((c) => ({
      id: c.id,
      slot: c.slot,
      status: c.status,
      hasImage: c.hasImage,
      imagePath: c.imagePath,
      direction: c.direction,
    })),
    selectedConcept: selected
      ? { id: selected.id, slot: selected.slot, direction: selected.direction }
      : null,
    order: orderRow
      ? {
          id: orderRow.id,
          merchantPaymentId: orderRow.merchant_payment_id,
          status: orderRow.status,
          currency: orderRow.currency,
          amountCents: orderRow.amount_cents,
          amountZar: orderRow.amount_cents / 100,
          amountFormatted: formatZar(orderRow.amount_cents / 100),
          payfastPaymentId: orderRow.payfast_payment_id,
          verifiedAt: orderRow.verified_at,
          price,
        }
      : null,
    timeline: {
      createdAt: project.created_at,
      generationStartedAt: project.generation_started_at,
      generationCompletedAt: project.generation_completed_at,
      paidAt: project.paid_at,
      updatedAt: project.updated_at,
    },
  };
}

/**
 * Best-effort team email via FormSubmit (existing site provider).
 * Never throws — payment success must not depend on email delivery.
 */
export async function notifyTeamHandoff(
  env: DesignStudioEnv,
  handoff: TeamHandoffPackage,
  fetchImpl: typeof fetch = fetch,
): Promise<{ sent: boolean; reason?: string }> {
  const email = (env.DESIGN_STUDIO_NOTIFY_EMAIL || '').trim();
  if (!email || !email.includes('@')) {
    return { sent: false, reason: 'notify_email_not_configured' };
  }

  try {
    const response = await fetchImpl(
      `https://formsubmit.co/ajax/${encodeURIComponent(email)}`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          name: 'Design Studio Handoff',
          email: handoff.contact.email || email,
          _subject: `Design Studio paid — ${handoff.publicReference}`,
          _template: 'table',
          message: formatHandoffEmailBody(handoff),
          project_reference: handoff.publicReference,
          project_id: handoff.projectId,
          status: handoff.status,
          amount: handoff.order?.amountFormatted || '',
        }),
      },
    );

    if (!response.ok) {
      return { sent: false, reason: `formsubmit_http_${response.status}` };
    }
    return { sent: true };
  } catch {
    return { sent: false, reason: 'formsubmit_unreachable' };
  }
}
