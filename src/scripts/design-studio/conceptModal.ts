/** Concept detail modal for Design Studio results (demo + live). */

export type ConceptModalView = {
  id: string;
  name: string;
  oneLineConcept: string;
  layoutDirection: string;
  heroDirection: string;
  typographyDirection: string;
  sectionFlow: string[];
  conversionStrategy: string;
  differentiators: string[];
  colourDirection?: string[];
  targetFeeling?: string[];
  bestFor?: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function initConceptDetailModal(concepts: ConceptModalView[]) {
  const modal = document.getElementById('concept-detail-modal');
  const titleEl = document.getElementById('concept-detail-title');
  const bodyEl = document.getElementById('concept-detail-body');
  const closeBtn = document.querySelector('[data-close-concept-modal]');
  let lastFocus: HTMLElement | null = null;

  function closeModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('overflow-hidden');
    lastFocus?.focus();
    lastFocus = null;
  }

  function openModal(conceptId: string | null, trigger?: HTMLElement | null) {
    if (!conceptId) return;
    const concept = concepts.find((c) => c.id === conceptId);
    if (!concept || !modal || !titleEl || !bodyEl) return;
    lastFocus = trigger || (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    titleEl.textContent = concept.name;
    const colours = (concept.colourDirection || [])
      .map(
        (c) =>
          `<span class="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-border-subtle)] px-2 py-0.5 text-xs"><span class="size-2.5 rounded-full border border-white/20" style="background:${escapeHtml(c)}"></span>${escapeHtml(c)}</span>`,
      )
      .join(' ');
    bodyEl.innerHTML = `
      <p>${escapeHtml(concept.oneLineConcept)}</p>
      ${concept.bestFor ? `<p><span class="text-fg-muted">Best for:</span> ${escapeHtml(concept.bestFor)}</p>` : ''}
      <p><span class="text-fg-muted">Layout:</span> ${escapeHtml(concept.layoutDirection || '—')}</p>
      <p><span class="text-fg-muted">Hero:</span> ${escapeHtml(concept.heroDirection || '—')}</p>
      <p><span class="text-fg-muted">Typography:</span> ${escapeHtml(concept.typographyDirection || '—')}</p>
      <p><span class="text-fg-muted">Sections:</span> ${escapeHtml((concept.sectionFlow || []).join(' → ') || '—')}</p>
      <p><span class="text-fg-muted">Conversion:</span> ${escapeHtml(concept.conversionStrategy || '—')}</p>
      <p><span class="text-fg-muted">Differentiators:</span> ${escapeHtml((concept.differentiators || []).join(' · ') || '—')}</p>
      ${(concept.targetFeeling || []).length ? `<p><span class="text-fg-muted">Feeling:</span> ${escapeHtml(concept.targetFeeling!.join(', '))}</p>` : ''}
      ${colours ? `<div class="flex flex-wrap gap-2 pt-1" aria-label="Colour direction">${colours}</div>` : ''}
    `;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.classList.add('overflow-hidden');
    if (closeBtn instanceof HTMLButtonElement) closeBtn.focus();
  }

  document.querySelectorAll('[data-concept-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openModal(
        btn.getAttribute('data-concept-view'),
        btn instanceof HTMLElement ? btn : null,
      );
    });
  });

  closeBtn?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal && !modal.hidden) closeModal();
  });

  modal?.setAttribute('aria-hidden', 'true');

  return { openModal, closeModal };
}
