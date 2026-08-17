import type { DesignStudioContact } from '@/utils/design-studio/validateContact';
import type {
  DesignStudioEnv,
  DesignStudioProjectRow,
  PublicDesignProject,
} from '@/server/design-studio/types';
import {
  authorizeProjectAccess,
  getProjectById,
  getPublicProject,
} from '@/server/design-studio/projects';
import type { DesignBrief } from '@/types/designStudio';

const CONTACT_MUTABLE_STATUSES = new Set(['CONCEPT_SELECTED', 'AWAITING_PAYMENT']);

/**
 * Persist contact details on a project that already has a selected concept.
 * Does not advance payment state — that happens when PayFast checkout starts.
 */
export async function saveProjectContact(
  env: DesignStudioEnv,
  input: {
    projectId: string;
    accessToken: string;
    contact: DesignStudioContact;
  },
): Promise<PublicDesignProject> {
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

  if (!CONTACT_MUTABLE_STATUSES.has(authorized.status)) {
    throw new Error('INVALID_STATE');
  }

  const updatedAt = new Date().toISOString();
  let brief: Partial<DesignBrief> = {};
  try {
    brief = JSON.parse(authorized.brief_json || '{}') as Partial<DesignBrief>;
  } catch {
    brief = {};
  }

  const nextBrief = {
    ...brief,
    businessName: input.contact.businessName,
  };

  await env.DESIGN_STUDIO_DB.prepare(
    `UPDATE design_projects
     SET contact_name = ?,
         contact_email = ?,
         contact_phone = ?,
         preferred_timing = ?,
         designer_note = ?,
         business_name = ?,
         brief_json = ?,
         updated_at = ?
     WHERE id = ?`,
  )
    .bind(
      input.contact.fullName,
      input.contact.email,
      input.contact.phone,
      input.contact.preferredTiming,
      input.contact.note,
      input.contact.businessName,
      JSON.stringify(nextBrief),
      updatedAt,
      input.projectId,
    )
    .run();

  const row = await getProjectById(env, input.projectId);
  if (!row) throw new Error('PROJECT_NOT_FOUND');
  return getPublicProject(row);
}

export function projectHasContact(row: DesignStudioProjectRow | PublicDesignProject): boolean {
  const name = 'contact_name' in row ? row.contact_name : null;
  const email = 'contact_email' in row ? row.contact_email : null;
  return Boolean(name && email);
}
