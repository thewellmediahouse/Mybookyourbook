/**
 * Browser client for Design Studio project APIs.
 * Used only on Design Studio routes.
 */
import type { DesignBrief, DesignProjectStatus } from '@/types/designStudio';

const PROJECT_SESSION_KEY = 'wellmedia.designStudio.project.v1';

export type DesignStudioPendingGeneration = {
  turnstileToken: string;
  brief?: Partial<DesignBrief>;
};

export type DesignStudioProjectSession = {
  projectId: string;
  publicReference: string;
  accessToken: string;
  status: string;
  /** Set by the wizard so results can start generation after an immediate redirect. */
  pendingGeneration?: DesignStudioPendingGeneration | null;
};

export function loadProjectSession(): DesignStudioProjectSession | null {
  try {
    const raw = localStorage.getItem(PROJECT_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DesignStudioProjectSession;
  } catch {
    return null;
  }
}

export function saveProjectSession(session: DesignStudioProjectSession): void {
  localStorage.setItem(PROJECT_SESSION_KEY, JSON.stringify(session));
}

export function clearProjectSession(): void {
  localStorage.removeItem(PROJECT_SESSION_KEY);
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: { message?: string } };
    return data.error?.message || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

export async function createDesignStudioProject(brief?: Partial<DesignBrief>): Promise<{
  session: DesignStudioProjectSession;
  project: unknown;
}> {
  const response = await fetch('/api/design-studio/create-project', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ brief: brief ?? {} }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = (await response.json()) as {
    projectId: string;
    publicReference: string;
    accessToken: string;
    status: string;
    project: unknown;
  };

  const session: DesignStudioProjectSession = {
    projectId: data.projectId,
    publicReference: data.publicReference,
    accessToken: data.accessToken,
    status: data.status,
  };
  saveProjectSession(session);
  return { session, project: data.project };
}

export async function fetchDesignStudioProject(
  projectId: string,
  accessToken: string,
): Promise<unknown> {
  const response = await fetch(`/api/design-studio/project/${encodeURIComponent(projectId)}`, {
    headers: {
      'x-design-studio-token': accessToken,
    },
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  const data = (await response.json()) as { project: unknown };
  return data.project;
}

export async function updateDesignStudioProject(
  projectId: string,
  accessToken: string,
  payload: { brief?: Partial<DesignBrief>; status?: DesignProjectStatus },
): Promise<unknown> {
  const response = await fetch(`/api/design-studio/project/${encodeURIComponent(projectId)}`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      'x-design-studio-token': accessToken,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  const data = (await response.json()) as { project: unknown };
  return data.project;
}

export type DesignStudioUpload = {
  id: string;
  kind: string;
  originalFilename: string | null;
  safeFilename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  assetPath: string;
};

export async function uploadDesignStudioFile(
  projectId: string,
  accessToken: string,
  file: File,
  kind?: string,
): Promise<DesignStudioUpload> {
  const form = new FormData();
  form.set('projectId', projectId);
  form.set('file', file, file.name);
  if (kind) form.set('kind', kind);

  const response = await fetch('/api/design-studio/upload', {
    method: 'POST',
    headers: {
      'x-design-studio-token': accessToken,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = (await response.json()) as { upload: DesignStudioUpload };
  return data.upload;
}

export async function deleteDesignStudioUpload(
  uploadId: string,
  accessToken: string,
): Promise<void> {
  const response = await fetch(`/api/design-studio/upload/${encodeURIComponent(uploadId)}`, {
    method: 'DELETE',
    headers: {
      'x-design-studio-token': accessToken,
    },
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}

export async function ensureDesignStudioProject(
  brief?: Partial<DesignBrief>,
): Promise<DesignStudioProjectSession> {
  const existing = loadProjectSession();
  if (existing?.projectId && existing.accessToken) {
    return existing;
  }
  const { session } = await createDesignStudioProject(brief);
  return session;
}

export async function startDesignStudioGeneration(
  projectId: string,
  accessToken: string,
  payload: { turnstileToken: string; brief?: Partial<DesignBrief> },
): Promise<unknown> {
  const response = await fetch('/api/design-studio/generate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-design-studio-token': accessToken,
    },
    body: JSON.stringify({
      projectId,
      turnstileToken: payload.turnstileToken,
      brief: payload.brief,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}

export async function retryDesignStudioImages(
  projectId: string,
  accessToken: string,
  options?: { conceptIds?: string[]; limit?: number },
): Promise<{
  concepts?: unknown[];
  generation?: { imagesPending?: boolean; message?: string };
}> {
  const response = await fetch('/api/design-studio/retry-images', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-design-studio-token': accessToken,
    },
    body: JSON.stringify({
      projectId,
      limit: options?.limit ?? 1,
      ...(options?.conceptIds?.length ? { conceptIds: options.conceptIds } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<{
    concepts?: unknown[];
    generation?: { imagesPending?: boolean; message?: string };
  }>;
}

export async function selectDesignStudioConcept(
  projectId: string,
  accessToken: string,
  conceptId: string,
): Promise<{
  status: string;
  project: { status?: string; selected_concept_id?: string | null };
  selectedConcept: { id: string; direction?: { name?: string } };
}> {
  const response = await fetch('/api/design-studio/select-concept', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-design-studio-token': accessToken,
    },
    body: JSON.stringify({ projectId, conceptId }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = (await response.json()) as {
    status: string;
    project: { status?: string; selected_concept_id?: string | null };
    selectedConcept: { id: string; direction?: { name?: string } };
  };

  const session = loadProjectSession();
  if (session && session.projectId === projectId) {
    saveProjectSession({ ...session, status: data.status || 'CONCEPT_SELECTED' });
  }

  return data;
}

export type CheckoutSummary = {
  projectId: string;
  publicReference: string;
  status: string;
  selectedConceptId: string;
  selectedConceptName: string;
  selectedConceptBlurb: string;
  websiteType: string;
  features: string[];
  price: {
    currency: 'ZAR';
    websiteType: string;
    amountZar: number | null;
    depositPercent: number;
    payableZar: number | null;
    requiresQuote: boolean;
    label: string;
    lineItems: Array<{ label: string; amountZar: number | null }>;
  };
  formatted: { amount: string; payable: string };
  hasContact: boolean;
  contact: {
    fullName: string | null;
    email: string | null;
    phone: string | null;
    businessName: string | null;
    preferredTiming: string | null;
    note: string | null;
  };
  afterPaymentNote: string;
  checkoutMode: 'pay' | 'quote';
};

export async function fetchCheckoutSummary(
  projectId: string,
  accessToken: string,
): Promise<CheckoutSummary> {
  const url = `/api/design-studio/checkout-summary?projectId=${encodeURIComponent(projectId)}`;
  const response = await fetch(url, {
    headers: { 'x-design-studio-token': accessToken },
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  const data = (await response.json()) as { checkout: CheckoutSummary };
  return data.checkout;
}

export async function saveDesignStudioContact(
  projectId: string,
  accessToken: string,
  contact: {
    fullName: string;
    email: string;
    phone: string;
    businessName: string;
    preferredTiming?: string;
    note?: string;
  },
): Promise<{ checkout: CheckoutSummary; message: string }> {
  const response = await fetch('/api/design-studio/contact', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-design-studio-token': accessToken,
    },
    body: JSON.stringify({ projectId, ...contact }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = (await response.json()) as {
    checkout: CheckoutSummary;
    message: string;
  };
  return { checkout: data.checkout, message: data.message };
}

export type CreatePaymentResult = {
  processUrl: string;
  fields: Record<string, string>;
  order: { merchantPaymentId: string; amountZar: number; status: string };
  message: string;
};

export async function createDesignStudioPayment(
  projectId: string,
  accessToken: string,
): Promise<CreatePaymentResult> {
  const response = await fetch('/api/design-studio/create-payment', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-design-studio-token': accessToken,
    },
    body: JSON.stringify({ projectId }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = (await response.json()) as CreatePaymentResult & {
    status?: string;
  };

  const session = loadProjectSession();
  if (session && session.projectId === projectId) {
    saveProjectSession({ ...session, status: 'AWAITING_PAYMENT' });
  }

  return data;
}

/** Auto-submit a signed PayFast form in the browser (never marks payment paid). */
export function submitPayfastForm(processUrl: string, fields: Record<string, string>): void {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = processUrl;
  form.acceptCharset = 'utf-8';
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}
