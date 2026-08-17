import {
  UPLOAD_LIMITS,
  buildUploadObjectKey,
  canMutateUploads,
  resolveUploadKind,
  sanitizeUploadBasename,
  sniffMimeType,
  truncateOriginalFilename,
  validateUploadConstraints,
} from '@/utils/design-studio/uploads';
import type { DesignUploadKind } from '@/types/designStudio';
import type { DesignStudioEnv } from '@/server/design-studio/types';
import { authorizeProjectAccess, getProjectById } from '@/server/design-studio/projects';

export type DesignUploadRow = {
  id: string;
  project_id: string;
  kind: string;
  original_filename: string | null;
  safe_filename: string;
  r2_object_key: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  deleted_at: string | null;
};

export type PublicDesignUpload = {
  id: string;
  kind: string;
  originalFilename: string | null;
  safeFilename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  assetPath: string;
};

function toPublicUpload(row: DesignUploadRow): PublicDesignUpload {
  return {
    id: row.id,
    kind: row.kind,
    originalFilename: row.original_filename,
    safeFilename: row.safe_filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
    assetPath: `/api/design-studio/asset/${row.id}`,
  };
}

export async function listActiveUploads(
  env: DesignStudioEnv,
  projectId: string,
): Promise<PublicDesignUpload[]> {
  const rows = await env.DESIGN_STUDIO_DB.prepare(
    `SELECT * FROM design_uploads
     WHERE project_id = ? AND deleted_at IS NULL
     ORDER BY created_at ASC`,
  )
    .bind(projectId)
    .all<DesignUploadRow>();

  return (rows.results ?? []).map(toPublicUpload);
}

export async function getUploadById(
  env: DesignStudioEnv,
  uploadId: string,
): Promise<DesignUploadRow | null> {
  return (
    (await env.DESIGN_STUDIO_DB.prepare(
      `SELECT * FROM design_uploads WHERE id = ? LIMIT 1`,
    )
      .bind(uploadId)
      .first<DesignUploadRow>()) ?? null
  );
}

async function sumActiveUploadBytes(
  env: DesignStudioEnv,
  projectId: string,
): Promise<number> {
  const row = await env.DESIGN_STUDIO_DB.prepare(
    `SELECT COALESCE(SUM(size_bytes), 0) AS total
     FROM design_uploads
     WHERE project_id = ? AND deleted_at IS NULL`,
  )
    .bind(projectId)
    .first<{ total: number }>();
  return Number(row?.total ?? 0);
}

async function countActiveByKind(
  env: DesignStudioEnv,
  projectId: string,
  kind: DesignUploadKind,
): Promise<number> {
  const row = await env.DESIGN_STUDIO_DB.prepare(
    `SELECT COUNT(*) AS count
     FROM design_uploads
     WHERE project_id = ? AND kind = ? AND deleted_at IS NULL`,
  )
    .bind(projectId, kind)
    .first<{ count: number }>();
  return Number(row?.count ?? 0);
}

export async function createProjectUpload(
  env: DesignStudioEnv,
  input: {
    projectId: string;
    accessToken: string;
    file: File;
    kindHint?: string | null;
  },
): Promise<PublicDesignUpload> {
  if (!env.DESIGN_STUDIO_ASSETS) {
    throw new Error('R2_UNAVAILABLE');
  }

  const project = await authorizeProjectAccess(env, input.projectId, input.accessToken);
  if (!project) {
    throw new Error('UNAUTHORIZED');
  }

  if (!canMutateUploads(project.status)) {
    throw new Error('UPLOADS_LOCKED');
  }

  const originalFilename = truncateOriginalFilename(input.file.name || 'upload');
  const kind = resolveUploadKind(input.kindHint, originalFilename);
  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const sniffed = sniffMimeType(bytes, input.file.type || '');
  if (!sniffed) {
    throw new Error('INVALID_MIME');
  }

  const constraints = validateUploadConstraints({
    mimeType: sniffed,
    sizeBytes: bytes.byteLength,
    originalFilename,
    kind,
  });
  if (!constraints.ok) {
    throw new Error(`VALIDATION:${constraints.error}`);
  }

  if (kind === 'logo') {
    const logos = await countActiveByKind(env, input.projectId, 'logo');
    if (logos >= UPLOAD_LIMITS.maxLogoFiles) {
      throw new Error('LOGO_LIMIT');
    }
  } else {
    const references = await env.DESIGN_STUDIO_DB.prepare(
      `SELECT COUNT(*) AS count FROM design_uploads
       WHERE project_id = ? AND kind != 'logo' AND deleted_at IS NULL`,
    )
      .bind(input.projectId)
      .first<{ count: number }>();
    if (Number(references?.count ?? 0) >= UPLOAD_LIMITS.maxReferenceFiles) {
      throw new Error('REFERENCE_LIMIT');
    }
  }

  const usedBytes = await sumActiveUploadBytes(env, input.projectId);
  if (usedBytes + bytes.byteLength > UPLOAD_LIMITS.maxProjectBytes) {
    throw new Error('PROJECT_SIZE_LIMIT');
  }

  const uploadId = crypto.randomUUID();
  const safeFilename = sanitizeUploadBasename(constraints.extension);
  const objectKey = buildUploadObjectKey(input.projectId, safeFilename);
  const createdAt = new Date().toISOString();

  await env.DESIGN_STUDIO_ASSETS.put(objectKey, bytes, {
    httpMetadata: { contentType: constraints.normalizedMime },
    customMetadata: {
      projectId: input.projectId,
      uploadId,
      kind,
    },
  });

  try {
    await env.DESIGN_STUDIO_DB.prepare(
      `INSERT INTO design_uploads (
        id, project_id, kind, original_filename, safe_filename,
        r2_object_key, mime_type, size_bytes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        uploadId,
        input.projectId,
        kind,
        originalFilename,
        safeFilename,
        objectKey,
        constraints.normalizedMime,
        bytes.byteLength,
        createdAt,
      )
      .run();
  } catch (error) {
    await env.DESIGN_STUDIO_ASSETS.delete(objectKey);
    throw error;
  }

  const row = await getUploadById(env, uploadId);
  if (!row) throw new Error('UPLOAD_CREATE_FAILED');
  return toPublicUpload(row);
}

/**
 * Server-side upload (e.g. logo scraped from an existing website).
 * Skips the client access-token path; caller must already authorize the project.
 */
export async function createServerUploadFromBytes(
  env: DesignStudioEnv,
  input: {
    projectId: string;
    bytes: Uint8Array;
    mimeType: string;
    filename: string;
    kind: DesignUploadKind;
  },
): Promise<PublicDesignUpload | null> {
  if (!env.DESIGN_STUDIO_ASSETS) return null;

  const sniffed = sniffMimeType(input.bytes, input.mimeType);
  if (!sniffed) return null;

  const originalFilename = truncateOriginalFilename(input.filename || 'upload');
  const constraints = validateUploadConstraints({
    mimeType: sniffed,
    sizeBytes: input.bytes.byteLength,
    originalFilename,
    kind: input.kind,
  });
  if (!constraints.ok) return null;

  if (input.kind === 'logo') {
    const logos = await countActiveByKind(env, input.projectId, 'logo');
    if (logos >= UPLOAD_LIMITS.maxLogoFiles) return null;
  }

  const usedBytes = await sumActiveUploadBytes(env, input.projectId);
  if (usedBytes + input.bytes.byteLength > UPLOAD_LIMITS.maxProjectBytes) {
    return null;
  }

  const uploadId = crypto.randomUUID();
  const safeFilename = sanitizeUploadBasename(constraints.extension);
  const objectKey = buildUploadObjectKey(input.projectId, safeFilename);
  const createdAt = new Date().toISOString();

  await env.DESIGN_STUDIO_ASSETS.put(objectKey, input.bytes, {
    httpMetadata: { contentType: constraints.normalizedMime },
    customMetadata: {
      projectId: input.projectId,
      uploadId,
      kind: input.kind,
      source: 'website_scan',
    },
  });

  try {
    await env.DESIGN_STUDIO_DB.prepare(
      `INSERT INTO design_uploads (
        id, project_id, kind, original_filename, safe_filename,
        r2_object_key, mime_type, size_bytes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        uploadId,
        input.projectId,
        input.kind,
        originalFilename,
        safeFilename,
        objectKey,
        constraints.normalizedMime,
        input.bytes.byteLength,
        createdAt,
      )
      .run();
  } catch (error) {
    await env.DESIGN_STUDIO_ASSETS.delete(objectKey);
    throw error;
  }

  const row = await getUploadById(env, uploadId);
  return row ? toPublicUpload(row) : null;
}

export async function softDeleteUpload(
  env: DesignStudioEnv,
  input: {
    uploadId: string;
    accessToken: string;
  },
): Promise<void> {
  const row = await getUploadById(env, input.uploadId);
  if (!row || row.deleted_at) {
    throw new Error('NOT_FOUND');
  }

  const project = await authorizeProjectAccess(env, row.project_id, input.accessToken);
  if (!project) {
    throw new Error('UNAUTHORIZED');
  }

  if (!canMutateUploads(project.status)) {
    throw new Error('UPLOADS_LOCKED');
  }

  const deletedAt = new Date().toISOString();
  await env.DESIGN_STUDIO_DB.prepare(
    `UPDATE design_uploads SET deleted_at = ? WHERE id = ?`,
  )
    .bind(deletedAt, input.uploadId)
    .run();

  if (env.DESIGN_STUDIO_ASSETS) {
    try {
      await env.DESIGN_STUDIO_ASSETS.delete(row.r2_object_key);
    } catch {
      // Soft-deleted in D1 even if R2 cleanup fails; avoid blocking the client.
    }
  }
}

export async function readAuthorizedUploadObject(
  env: DesignStudioEnv,
  input: {
    uploadId: string;
    accessToken: string;
  },
): Promise<{ row: DesignUploadRow; object: R2ObjectBody }> {
  if (!env.DESIGN_STUDIO_ASSETS) {
    throw new Error('R2_UNAVAILABLE');
  }

  const row = await getUploadById(env, input.uploadId);
  if (!row || row.deleted_at) {
    throw new Error('NOT_FOUND');
  }

  const project = await authorizeProjectAccess(env, row.project_id, input.accessToken);
  if (!project) {
    throw new Error('UNAUTHORIZED');
  }

  // Ensure project still exists (defence in depth).
  const stillThere = await getProjectById(env, row.project_id);
  if (!stillThere) {
    throw new Error('NOT_FOUND');
  }

  const object = await env.DESIGN_STUDIO_ASSETS.get(row.r2_object_key);
  if (!object) {
    throw new Error('NOT_FOUND');
  }

  return { row, object };
}

export { toPublicUpload };
