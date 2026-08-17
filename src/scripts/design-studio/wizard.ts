/**
 * Design Studio wizard — localStorage persistence + step UI.
 * Loaded only on /design-your-website/create.
 */
import type { DesignBrief, WizardPersistedState } from '@/types/designStudio';
import { validateWizardStep } from '@/utils/design-studio/validateBrief';
import {
  formatWizardPriceEstimate,
  type PricingConfigSlice,
} from '@/utils/design-studio/pricingCore';
import {
  clearProjectSession,
  createDesignStudioProject,
  deleteDesignStudioUpload,
  ensureDesignStudioProject,
  loadProjectSession,
  saveProjectSession,
  uploadDesignStudioFile,
} from '@/scripts/design-studio/api';

export type WizardConfigPayload = {
  storageKey: string;
  demoResultsRoute: string;
  resultsRoutePrefix: string;
  stepCount: number;
  stepLabels: string[];
  customScopeTypes: string[];
  turnstileSiteKey: string;
  pricing: PricingConfigSlice;
};

const DEFAULT_BRIEF: Partial<DesignBrief> = {
  businessName: '',
  industry: '',
  customIndustry: '',
  businessDescription: '',
  existingWebsiteUrl: '',
  market: '',
  goals: [],
  websiteType: '',
  primaryStyle: '',
  secondaryStyle: '',
  colourMode: '',
  customColours: [],
  features: [],
  pages: ['Home', 'About', 'Contact'],
  customPages: [],
  uploadNames: [],
  uploadedFiles: [],
  freeTextBrief: '',
  avoid: '',
  acceptedTerms: false,
  shopDetails: {
    productCount: '',
    productKinds: [],
    deliveryRequired: false,
    onlinePaymentRequired: false,
  },
};

function readState(storageKey: string): WizardPersistedState {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return {
        version: 1,
        currentStep: 1,
        brief: { ...DEFAULT_BRIEF },
        updatedAt: new Date().toISOString(),
      };
    }
    const parsed = JSON.parse(raw) as WizardPersistedState;
    return {
      version: 1,
      currentStep: Math.min(Math.max(parsed.currentStep || 1, 1), 10),
      brief: { ...DEFAULT_BRIEF, ...parsed.brief },
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return {
      version: 1,
      currentStep: 1,
      brief: { ...DEFAULT_BRIEF },
      updatedAt: new Date().toISOString(),
    };
  }
}

function writeState(storageKey: string, state: WizardPersistedState) {
  const next = { ...state, updatedAt: new Date().toISOString() };
  localStorage.setItem(storageKey, JSON.stringify(next));
}

function slugifyColour(value: string): string {
  return value.trim();
}

export function initDesignStudioWizard(root: HTMLElement, config: WizardConfigPayload) {
  let state = readState(config.storageKey);

  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-wizard-step]'));
  const form = root.querySelector<HTMLFormElement>('[data-wizard-form]');
  const backBtn = root.querySelector<HTMLButtonElement>('[data-wizard-back]');
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-wizard-next]');
  const generateBtn = root.querySelector<HTMLButtonElement>('[data-wizard-generate]');
  const viewResultsBtn = root.querySelector<HTMLAnchorElement>('[data-wizard-view-results]');
  const startFreshBtn = root.querySelector<HTMLButtonElement>('[data-wizard-start-fresh]');
  const progressCurrent = root.querySelector<HTMLElement>('[data-progress-current]');
  const progressLabel = root.querySelector<HTMLElement>('[data-progress-label]');
  const progressBars = Array.from(root.querySelectorAll<HTMLElement>('[data-progress-bar]'));
  const errorEl = root.querySelector<HTMLElement>('[data-wizard-error]');
  const statusEl = root.querySelector<HTMLElement>('[data-wizard-status]');
  const reviewEl = root.querySelector<HTMLElement>('[data-wizard-review]');
  const priceHeadline = root.querySelector<HTMLElement>('[data-price-estimate-headline]');
  const priceDetail = root.querySelector<HTMLElement>('[data-price-estimate-detail]');
  const turnstileHost = root.querySelector<HTMLElement>('[data-turnstile]');
  let turnstileWidgetId: string | null = null;
  let hasExistingGenerationBatch = false;
  const customScopeSet = new Set(config.customScopeTypes);
  const generateLabelDefault =
    generateBtn?.textContent?.trim() || 'Generate directions';

  const GENERATED_STATUSES = new Set([
    'GENERATED',
    'CONCEPT_SELECTED',
    'CONTACT_CAPTURED',
    'AWAITING_PAYMENT',
    'PAID',
    'READY_FOR_DESIGNER',
  ]);

  type TurnstileApi = {
    render: (
      el: HTMLElement,
      options: {
        sitekey: string;
        theme?: string;
        callback?: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
      },
    ) => string;
    reset: (widgetId?: string) => void;
    getResponse: (widgetId?: string) => string;
  };

  function getTurnstile(): TurnstileApi | null {
    const api = (window as Window & { turnstile?: TurnstileApi }).turnstile;
    return api ?? null;
  }

  function resetTurnstile() {
    const api = getTurnstile();
    if (api && turnstileWidgetId != null) {
      api.reset(turnstileWidgetId);
    }
  }

  function ensureTurnstileWidget(): boolean {
    if (!turnstileHost || !config.turnstileSiteKey) return false;
    const api = getTurnstile();
    if (!api) return false;
    // Never reset here — resetting clears a completed challenge and forces re-confirm.
    if (turnstileWidgetId != null) return true;
    turnstileHost.innerHTML = '';
    turnstileWidgetId = api.render(turnstileHost, {
      sitekey: config.turnstileSiteKey,
      theme: 'dark',
      'expired-callback': () => setError('Security check expired. Please complete it again.'),
      'error-callback': () =>
        setError(
          'Security check failed to load. Confirm this domain is allowed on your Turnstile widget, then refresh.',
        ),
    });
    return true;
  }

  function waitForTurnstile(attempts = 12): Promise<boolean> {
    return new Promise((resolve) => {
      let left = attempts;
      const tick = () => {
        if (ensureTurnstileWidget()) {
          resolve(true);
          return;
        }
        left -= 1;
        if (left <= 0) {
          resolve(false);
          return;
        }
        window.setTimeout(tick, 250);
      };
      tick();
    });
  }

  function readTurnstileToken(): string {
    const api = getTurnstile();
    if (api && turnstileWidgetId != null) {
      return api.getResponse(turnstileWidgetId) || '';
    }
    const input = form?.querySelector<HTMLInputElement>('[name="cf-turnstile-response"]');
    return input?.value?.trim() || '';
  }
  const customIndustryWrap = root.querySelector<HTMLElement>('[data-custom-industry]');
  const customColoursWrap = root.querySelector<HTMLElement>('[data-custom-colours]');
  const shopDetailsWrap = root.querySelector<HTMLElement>('[data-shop-details]');
  const customScopeNote = root.querySelector<HTMLElement>('[data-custom-scope-note]');
  const fileInput = root.querySelector<HTMLInputElement>('[data-upload-input]');
  const uploadList = root.querySelector<HTMLElement>('[data-upload-list]');

  function setError(message: string | null) {
    if (!errorEl) return;
    if (!message) {
      errorEl.classList.add('hidden');
      errorEl.textContent = '';
      return;
    }
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function setStatus(message: string | null) {
    if (!statusEl) return;
    if (!message) {
      statusEl.classList.add('hidden');
      statusEl.textContent = '';
      return;
    }
    statusEl.textContent = message;
    statusEl.classList.remove('hidden');
  }

  /** Toggle both `hidden` and `inline-flex` — Tailwind can otherwise leave the button visible. */
  function setActionVisible(el: HTMLElement | null, visible: boolean) {
    if (!el) return;
    el.classList.toggle('hidden', !visible);
    el.classList.toggle('inline-flex', visible);
  }

  function resultsUrlFor(projectId: string): string {
    return `${config.resultsRoutePrefix}/${encodeURIComponent(projectId)}`;
  }

  function syncStepActions() {
    const onLast = state.currentStep === config.stepCount;
    // Continue must never show on step 10.
    setActionVisible(nextBtn, !onLast);
    setActionVisible(generateBtn, onLast && !hasExistingGenerationBatch);
    setActionVisible(viewResultsBtn, onLast && hasExistingGenerationBatch);
    setActionVisible(startFreshBtn, onLast && hasExistingGenerationBatch);
    if (backBtn) {
      // Always allow going back from step 10 (including while a prior batch exists).
      backBtn.disabled = state.currentStep === 1;
    }
  }

  function setExistingBatchUi(enabled: boolean, projectId?: string) {
    hasExistingGenerationBatch = enabled;

    if (enabled && projectId && viewResultsBtn) {
      viewResultsBtn.href = resultsUrlFor(projectId);
      setStatus(
        'This project already has generated previews. Open them, or start a fresh generation with a new project.',
      );
    }

    syncStepActions();
  }

  async function refreshExistingBatchState(): Promise<boolean> {
    const session = loadProjectSession();
    if (!session?.projectId || !session.accessToken) {
      setExistingBatchUi(false);
      return false;
    }

    try {
      const response = await fetch(
        `/api/design-studio/project/${encodeURIComponent(session.projectId)}`,
        { headers: { 'x-design-studio-token': session.accessToken } },
      );
      if (!response.ok) {
        // Fall back to local session only when the API is unavailable.
        const localExists = GENERATED_STATUSES.has(session.status);
        setExistingBatchUi(localExists, localExists ? session.projectId : undefined);
        return localExists;
      }
      const data = (await response.json()) as {
        project?: { status?: string };
        concepts?: unknown[];
      };
      const status = data.project?.status || session.status;
      const hasConcepts = (data.concepts?.length ?? 0) > 0;
      const exists = hasConcepts || GENERATED_STATUSES.has(status);
      saveProjectSession({ ...session, status: status || session.status });
      if (exists) {
        setExistingBatchUi(true, session.projectId);
        return true;
      }
      setExistingBatchUi(false);
      return false;
    } catch {
      const localExists = GENERATED_STATUSES.has(session.status);
      setExistingBatchUi(localExists, localExists ? session.projectId : undefined);
      return localExists;
    }
  }

  function collectFromDom(): Partial<DesignBrief> {
    if (!form) return state.brief;

    const fd = new FormData(form);
    const goals = fd.getAll('goals').map(String);
    const features = fd.getAll('features').map(String);
    const pages = fd.getAll('pages').map(String);
    const productKinds = fd.getAll('productKinds').map(String);
    const customPagesRaw = String(fd.get('customPages') || '');
    const customPages = customPagesRaw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const customColoursRaw = String(fd.get('customColours') || '');
    const customColours = customColoursRaw
      .split(',')
      .map(slugifyColour)
      .filter((c) => /^#?[0-9a-fA-F]{3,8}$/.test(c.replace('#', '')) || c.startsWith('#'));

    return {
      ...state.brief,
      businessName: String(fd.get('businessName') || '').trim(),
      industry: String(fd.get('industry') || ''),
      customIndustry: String(fd.get('customIndustry') || '').trim(),
      businessDescription: String(fd.get('businessDescription') || '').trim(),
      existingWebsiteUrl: String(fd.get('existingWebsiteUrl') || '').trim(),
      market: String(fd.get('market') || '').trim(),
      goals,
      websiteType: String(fd.get('websiteType') || ''),
      primaryStyle: String(fd.get('primaryStyle') || ''),
      secondaryStyle: String(fd.get('secondaryStyle') || '') || undefined,
      colourMode: String(fd.get('colourMode') || ''),
      customColours,
      features,
      pages,
      customPages,
      freeTextBrief: String(fd.get('freeTextBrief') || '').trim(),
      avoid: String(fd.get('avoid') || '').trim(),
      acceptedTerms: fd.get('acceptedTerms') === 'on',
      shopDetails: {
        productCount: String(fd.get('productCount') || '').trim(),
        productKinds,
        deliveryRequired: fd.get('deliveryRequired') === 'on',
        onlinePaymentRequired: fd.get('onlinePaymentRequired') === 'on',
      },
      uploadNames: state.brief.uploadNames ?? [],
    };
  }

  function applyBriefToDom(brief: Partial<DesignBrief>) {
    if (!form) return;

    const setValue = (name: string, value: string | undefined) => {
      const el = form.elements.namedItem(name);
      if (!el) return;

      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLSelectElement ||
        el instanceof HTMLTextAreaElement
      ) {
        if (el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox')) {
          return;
        }
        el.value = value ?? '';
        return;
      }

      if (typeof RadioNodeList !== 'undefined' && el instanceof RadioNodeList) {
        Array.from(el).forEach((node) => {
          if (node instanceof HTMLInputElement && node.type === 'radio') {
            node.checked = node.value === (value ?? '');
          }
        });
      }
    };

    setValue('businessName', brief.businessName);
    setValue('industry', brief.industry);
    setValue('customIndustry', brief.customIndustry);
    setValue('businessDescription', brief.businessDescription);
    setValue('existingWebsiteUrl', brief.existingWebsiteUrl);
    setValue('market', brief.market);
    setValue('websiteType', brief.websiteType);
    setValue('primaryStyle', brief.primaryStyle);
    setValue('secondaryStyle', brief.secondaryStyle);
    setValue('colourMode', brief.colourMode);
    setValue('customColours', (brief.customColours ?? []).join(', '));
    setValue('customPages', (brief.customPages ?? []).join(', '));
    setValue('freeTextBrief', brief.freeTextBrief);
    setValue('avoid', brief.avoid);
    setValue('productCount', brief.shopDetails?.productCount);

    const setCheckedGroup = (name: string, values: string[] | undefined) => {
      const selected = new Set(values ?? []);
      form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`).forEach((input) => {
        input.checked = selected.has(input.value);
      });
    };

    setCheckedGroup('goals', brief.goals);
    setCheckedGroup('features', brief.features);
    setCheckedGroup('pages', brief.pages);
    setCheckedGroup('productKinds', brief.shopDetails?.productKinds);

    const terms = form.elements.namedItem('acceptedTerms');
    if (terms && 'checked' in terms) {
      (terms as HTMLInputElement).checked = Boolean(brief.acceptedTerms);
    }

    const delivery = form.elements.namedItem('deliveryRequired');
    if (delivery && 'checked' in delivery) {
      (delivery as HTMLInputElement).checked = Boolean(brief.shopDetails?.deliveryRequired);
    }

    const payment = form.elements.namedItem('onlinePaymentRequired');
    if (payment && 'checked' in payment) {
      (payment as HTMLInputElement).checked = Boolean(brief.shopDetails?.onlinePaymentRequired);
    }

    renderUploads();
    syncConditionalFields();
  }

  function getUploadLabels(): string[] {
    const remote = (state.brief.uploadedFiles ?? []).map((f) => f.name);
    const local = state.brief.uploadNames ?? [];
    return [...remote, ...local];
  }

  function renderUploads() {
    if (!uploadList) return;
    const remote = state.brief.uploadedFiles ?? [];
    const local = state.brief.uploadNames ?? [];
    if (!remote.length && !local.length) {
      uploadList.innerHTML = '<p class="text-small text-fg-muted">No files added yet.</p>';
      return;
    }

    const remoteItems = remote
      .map(
        (file) => `
        <li class="flex items-center justify-between gap-3 rounded-xl border border-[var(--brand-border-subtle)] px-3 py-2 text-small text-fg-soft">
          <span class="truncate">${file.name} <span class="text-fg-muted">(${file.kind})</span></span>
          <button type="button" class="text-accent hover:underline" data-remove-remote-upload="${file.id}">Remove</button>
        </li>`,
      )
      .join('');

    const localItems = local
      .map(
        (name, index) => `
        <li class="flex items-center justify-between gap-3 rounded-xl border border-[var(--brand-border-subtle)] px-3 py-2 text-small text-fg-soft">
          <span class="truncate">${name} <span class="text-fg-muted">(local)</span></span>
          <button type="button" class="text-accent hover:underline" data-remove-upload="${index}">Remove</button>
        </li>`,
      )
      .join('');

    uploadList.innerHTML = remoteItems + localItems;
  }

  function updatePriceEstimate(brief: Partial<DesignBrief> = state.brief) {
    if (!priceHeadline || !priceDetail || !config.pricing) return;
    const estimate = formatWizardPriceEstimate(
      {
        websiteType: brief.websiteType || '',
        features: brief.features || [],
      },
      config.pricing,
      customScopeSet,
    );
    priceHeadline.textContent = estimate.headline;
    priceDetail.textContent = estimate.detail;
  }

  function syncConditionalFields() {
    const brief = collectFromDom();
    if (customIndustryWrap) {
      customIndustryWrap.classList.toggle('hidden', brief.industry !== 'Other');
    }
    if (customColoursWrap) {
      customColoursWrap.classList.toggle('hidden', brief.colourMode !== 'Custom colours');
    }
    if (shopDetailsWrap) {
      shopDetailsWrap.classList.toggle('hidden', !(brief.features ?? []).includes('Online shop'));
    }
    if (customScopeNote) {
      const isCustom = config.customScopeTypes.includes(brief.websiteType ?? '');
      customScopeNote.classList.toggle('hidden', !isCustom);
    }
    updatePriceEstimate(brief);
  }

  function renderReview(brief: Partial<DesignBrief>) {
    if (!reviewEl) return;
    const industry =
      brief.industry === 'Other' ? brief.customIndustry || 'Other' : brief.industry || '—';
    const estimate = formatWizardPriceEstimate(
      {
        websiteType: brief.websiteType || '',
        features: brief.features || [],
      },
      config.pricing,
      customScopeSet,
    );
    const rows: Array<[string, string]> = [
      ['Business', brief.businessName || '—'],
      ['Industry', industry],
      ['Website type', brief.websiteType || '—'],
      ['Goals', (brief.goals ?? []).join(', ') || '—'],
      ['Primary style', brief.primaryStyle || '—'],
      ['Colours', brief.colourMode || '—'],
      ['Features', (brief.features ?? []).join(', ') || '—'],
      [
        'Pages',
        [...(brief.pages ?? []), ...(brief.customPages ?? [])].join(', ') || '—',
      ],
      ['Uploads', getUploadLabels().join(', ') || 'None yet'],
      ['Estimated package', `${estimate.headline} — ${estimate.detail}`],
      ['Brief', brief.freeTextBrief || '—'],
    ];

    reviewEl.innerHTML = rows
      .map(
        ([label, value]) => `
        <div class="border-b border-[var(--brand-border-subtle)]/50 py-3 last:border-0">
          <dt class="text-xs tracking-wide text-fg-muted uppercase">${label}</dt>
          <dd class="mt-1 text-fg-soft">${value}</dd>
        </div>`,
      )
      .join('');
  }

  function showStep(step: number) {
    state.currentStep = step;
    panels.forEach((panel) => {
      const panelStep = Number(panel.dataset.wizardStep);
      const active = panelStep === step;
      panel.classList.toggle('hidden', !active);
      panel.setAttribute('aria-hidden', active ? 'false' : 'true');
    });

    if (progressCurrent) progressCurrent.textContent = String(step);
    if (progressLabel) progressLabel.textContent = config.stepLabels[step - 1] ?? '';
    progressBars.forEach((bar) => {
      const n = Number(bar.dataset.progressBar);
      bar.classList.toggle('bg-accent', n <= step);
      bar.classList.toggle('bg-[var(--brand-border-subtle)]', n > step);
      if (n === step) bar.setAttribute('aria-current', 'step');
      else bar.removeAttribute('aria-current');
    });

    syncStepActions();

    if (step === config.stepCount) {
      renderReview(state.brief);
      setError(null);
      void refreshExistingBatchState().then((exists) => {
        syncStepActions();
        if (exists) return;
        setStatus(
          'Step 10: accept the terms, complete the security check, then click Generate directions. You can go Back anytime before generating.',
        );
        void waitForTurnstile().then((ready) => {
          if (!ready) {
            setError(
              'Security check did not load. Refresh the page, or open the site on https://thewellmedia.com after deploy.',
            );
          }
        });
      });
    } else {
      setStatus(null);
    }

    const activePanel = panels.find((p) => Number(p.dataset.wizardStep) === step);
    const focusTarget = activePanel?.querySelector<HTMLElement>(
      'input, select, textarea, button, [href]',
    );
    focusTarget?.focus({ preventScroll: true });

    writeState(config.storageKey, state);
    if (step !== config.stepCount) setError(null);
  }

  function persistFromDom() {
    state.brief = collectFromDom();
    writeState(config.storageKey, state);
    syncConditionalFields();
  }

  applyBriefToDom(state.brief);
  updatePriceEstimate(state.brief);
  showStep(state.currentStep);

  form?.addEventListener('change', () => {
    persistFromDom();
  });
  form?.addEventListener('input', () => {
    persistFromDom();
  });

  backBtn?.addEventListener('click', () => {
    persistFromDom();
    if (state.currentStep > 1) showStep(state.currentStep - 1);
  });

  nextBtn?.addEventListener('click', () => {
    persistFromDom();
    const error = validateWizardStep(state.currentStep, state.brief);
    if (error) {
      setError(error);
      return;
    }
    if (state.currentStep < config.stepCount) showStep(state.currentStep + 1);
  });

  startFreshBtn?.addEventListener('click', async () => {
    persistFromDom();
    startFreshBtn.disabled = true;
    setError(null);
    setStatus('Starting a fresh project so you can generate again…');
    try {
      clearProjectSession();
      const { session } = await createDesignStudioProject(state.brief);
      saveProjectSession({
        ...session,
        status: session.status || 'DRAFT',
        pendingGeneration: null,
      });
      hasExistingGenerationBatch = false;
      syncStepActions();
      setStatus('Fresh project ready. Complete the security check, then Generate directions.');
      resetTurnstile();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to start a fresh project. Please try again.',
      );
      setStatus(null);
    } finally {
      startFreshBtn.disabled = false;
    }
  });

  generateBtn?.addEventListener('click', async () => {
    persistFromDom();
    const error = validateWizardStep(state.currentStep, state.brief);
    if (error) {
      setError(error);
      return;
    }
    writeState(config.storageKey, state);

    // Already generated — open previews instead of starting another batch.
    const existing = await refreshExistingBatchState();
    if (existing) {
      const session = loadProjectSession();
      if (session?.projectId) {
        window.location.href = resultsUrlFor(session.projectId);
        return;
      }
    }

    if (config.turnstileSiteKey) {
      const ready = await waitForTurnstile();
      if (!ready) {
        setError('Security check is still loading. Wait a moment, then try again.');
        return;
      }
    }

    const turnstileToken = readTurnstileToken();
    if (config.turnstileSiteKey && !turnstileToken) {
      setError('Please complete the security check before generating.');
      return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = 'Opening results…';
    setError(null);
    setStatus('Opening your results — directions and visuals will load there.');

    try {
      const session = await ensureDesignStudioProject(state.brief);
      saveProjectSession({
        ...session,
        status: 'GENERATING',
        pendingGeneration: {
          turnstileToken: turnstileToken || '',
          brief: state.brief,
        },
      });
      window.location.href = resultsUrlFor(session.projectId);
      return;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to start generation. Please try again.';
      if (
        message.includes('already has a concept generation batch') ||
        message.includes('generation batch')
      ) {
        const session = loadProjectSession();
        if (session?.projectId) {
          setExistingBatchUi(true, session.projectId);
          setError(null);
          generateBtn.disabled = false;
          generateBtn.textContent = generateLabelDefault;
          return;
        }
      }
      const hint =
        message.includes('not available') || message.includes('not_found')
          ? `${message} The live domain may still be on an old deploy — try again after republish, or use the Worker URL.`
          : message;
      setError(hint);
      setStatus(null);
      resetTurnstile();
      generateBtn.disabled = false;
      generateBtn.textContent = generateLabelDefault;

      // Astro-only local preview without Worker: keep demo escape hatch when API is offline.
      if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        window.location.href = config.demoResultsRoute;
      }
    }
  });

  fileInput?.addEventListener('change', async () => {
    const files = Array.from(fileInput.files ?? []);
    if (!files.length) return;
    fileInput.value = '';
    setError(null);

    persistFromDom();

    try {
      const session = await ensureDesignStudioProject(state.brief);
      for (const file of files) {
        const kind = file.name.toLowerCase().includes('logo')
          ? 'logo'
          : file.type === 'application/pdf'
            ? 'brand_guide'
            : 'reference';
        const uploaded = await uploadDesignStudioFile(
          session.projectId,
          session.accessToken,
          file,
          kind,
        );
        state.brief.uploadedFiles = [
          ...(state.brief.uploadedFiles ?? []),
          { id: uploaded.id, name: uploaded.originalFilename || file.name, kind: uploaded.kind },
        ];
      }
      writeState(config.storageKey, state);
      renderUploads();
      return;
    } catch {
      // Fall back to local filenames when Worker/R2 is unavailable (astro-only dev).
    }

    const names = [...(state.brief.uploadNames ?? [])];
    for (const file of files) {
      if (names.length >= 11) break;
      names.push(file.name);
    }
    state.brief.uploadNames = names;
    writeState(config.storageKey, state);
    renderUploads();
  });

  uploadList?.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement | null;
    const remoteId = target?.getAttribute('data-remove-remote-upload');
    if (remoteId) {
      const session = loadProjectSession();
      if (session?.accessToken) {
        try {
          await deleteDesignStudioUpload(remoteId, session.accessToken);
        } catch {
          setError('Could not remove the uploaded file. Please try again.');
          return;
        }
      }
      state.brief.uploadedFiles = (state.brief.uploadedFiles ?? []).filter((f) => f.id !== remoteId);
      writeState(config.storageKey, state);
      renderUploads();
      return;
    }

    const indexAttr = target?.getAttribute('data-remove-upload');
    if (indexAttr == null) return;
    const index = Number(indexAttr);
    const names = [...(state.brief.uploadNames ?? [])];
    names.splice(index, 1);
    state.brief.uploadNames = names;
    writeState(config.storageKey, state);
    renderUploads();
  });
}
