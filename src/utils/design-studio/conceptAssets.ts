/** R2 key helpers and concurrency for Design Studio concept images. */

export function conceptSlotLabel(slot: number): string {
  return `concept-${String(slot).padStart(2, '0')}`;
}

export function extensionForImageMime(mimeType: string): string {
  const mime = mimeType.toLowerCase().split(';')[0]?.trim() || '';
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  return 'png';
}

export function buildConceptObjectKey(
  projectId: string,
  slot: number,
  mimeType: string,
): string {
  const ext = extensionForImageMime(mimeType);
  return `design-studio/${projectId}/concepts/${conceptSlotLabel(slot)}.${ext}`;
}

/** Run async work over items with a fixed concurrency pool. */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const limit = Math.max(1, Math.min(concurrency, items.length || 1));
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index]!, index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => runWorker()));
  return results;
}

/** Failed slots may retry once; final failures are locked. */
export function canRetryFailedConcept(errorCode: string | null | undefined): boolean {
  if (!errorCode) return true;
  return errorCode !== 'image_failed_final' && errorCode !== 'retry_exhausted';
}

export function nextImageFailureCode(previous: string | null | undefined): string {
  // First failure → image_failed; second failure after retry → locked.
  if (previous === 'image_failed') return 'image_failed_final';
  if (previous === 'image_failed_final' || previous === 'retry_exhausted') {
    return 'image_failed_final';
  }
  return 'image_failed';
}
