"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  attachLibraryReferenceAction,
  removeReferenceAction,
  saveBriefAction,
} from "@/app/dashboard/create/actions";
import { ConceptPanel } from "@/components/create/concept-panel";
import { uploadSignedFile } from "@/components/media/upload";
import { MediaPreview } from "@/components/media/preview";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PublicCreativeConcept } from "@/lib/ai/creative-director";
import { libraryAcceptAttribute, LIBRARY_MAX_BYTES } from "@/lib/media/mime";
import {
  AD_STYLES,
  ADVERTISING_TYPES,
  ASPECT_RATIOS,
  CONTEXT_REFERENCE_LIMIT,
  CTA_TYPES,
  DURATIONS,
  PLATFORMS,
  TONE_OPTIONS,
  recommendedAspectRatio,
  requireExplicitAspectRatio,
  type ToneOption,
} from "@/lib/projects/brief";
import { STUDIO_VIRAL_HINT, WIZARD_STEPS } from "@/lib/projects/copy";
import { isStudioLane } from "@/lib/studio/presets";
import { cn } from "@/lib/utils";

export type WizardBrief = {
  projectId: string | null;
  businessId: string;
  title: string;
  objective: string;
  targetCustomer: string;
  problem: string;
  valueProposition: string;
  offer: string;
  ctaType: string;
  ctaValue: string;
  style: string;
  tones: ToneOption[];
  avoid: string;
  platform: string;
  aspectRatio: string;
  duration: number;
  references: {
    id: string;
    assetId: string;
    source: "library" | "project";
  }[];
};

const BRIEF_STEPS = WIZARD_STEPS.filter((step) => !("later" in step && step.later));
const CONCEPT_STEP = BRIEF_STEPS.findIndex((step) => step.id === "concept");

export function CreateWizard({
  initial,
  brands,
  library,
  concept,
  briefLocked,
  credits,
  initialStep,
  lane,
}: {
  initial: WizardBrief;
  brands: { id: string; name: string }[];
  library: { id: string; role: string; mimeType: string }[];
  concept: PublicCreativeConcept | null;
  briefLocked: boolean;
  credits: number;
  initialStep?: string;
  lane?: string;
}) {
  const router = useRouter();
  const requestedStep = BRIEF_STEPS.findIndex((item) => item.id === initialStep);
  const [step, setStep] = useState(
    concept ? Math.max(CONCEPT_STEP, 0) : requestedStep >= 0 ? requestedStep : 0,
  );
  const [brief, setBrief] = useState(initial);
  const [locked, setLocked] = useState(briefLocked);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const briefRef = useRef(brief);
  briefRef.current = brief;

  useEffect(() => {
    return () => {
      if (timer.current) {
        window.clearTimeout(timer.current);
      }
    };
  }, []);

  function patch(next: Partial<WizardBrief>, autosave = true) {
    setBrief((current) => {
      const merged = { ...current, ...next };
      briefRef.current = merged;
      return merged;
    });
    if (!autosave || locked) {
      return;
    }
    queueSave();
  }

  function queueSave() {
    if (timer.current) {
      window.clearTimeout(timer.current);
    }
    timer.current = window.setTimeout(() => {
      void persist();
    }, 600);
  }

  async function persist(current = briefRef.current) {
    if (locked) {
      return { projectId: current.projectId, error: undefined as string | undefined };
    }
    if (!current.businessId && brands.length !== 1) {
      return { projectId: current.projectId, error: undefined as string | undefined };
    }
    setStatus("saving");
    const result = await saveBriefAction({
      projectId: current.projectId,
      businessId: current.businessId || brands[0]?.id,
      title: current.title,
      objective: current.objective,
      targetCustomer: current.targetCustomer,
      problem: current.problem,
      valueProposition: current.valueProposition,
      offer: current.offer,
      ctaType: current.ctaType,
      ctaValue: current.ctaValue,
      style: current.style,
      tones: current.tones,
      avoid: current.avoid,
      platform: current.platform,
      aspectRatio: current.aspectRatio,
      duration: current.duration,
    });
    if (result.error) {
      setStatus("error");
      setError(result.error);
      return result;
    }
    if (result.projectId && result.projectId !== current.projectId) {
      setBrief((item) => ({ ...item, projectId: result.projectId ?? item.projectId }));
      router.replace(`/dashboard/create?project=${result.projectId}`);
    }
    setStatus("saved");
    setError(null);
    return result;
  }

  async function goNext() {
    setError(null);
    if (BRIEF_STEPS[step]?.id === "campaign") {
      if (!brief.title.trim()) {
        setError("Give this campaign a title.");
        return;
      }
      if (!brief.objective) {
        setError("Choose what we are advertising.");
        return;
      }
      const saved = await persist();
      if (saved?.error) {
        return;
      }
    }
    if (BRIEF_STEPS[step]?.id === "format") {
      try {
        requireExplicitAspectRatio(brief.aspectRatio);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Choose an aspect ratio.");
        return;
      }
      await persist();
    }
    setStep((value) => Math.min(value + 1, BRIEF_STEPS.length - 1));
  }

  const recommended = recommendedAspectRatio(brief.platform);

  return (
    <div className="mt-10">
      <ol className="flex flex-wrap gap-2 text-xs tracking-[0.18em] text-muted">
        {WIZARD_STEPS.map((item, index) => (
          <li
            key={item.id}
            className={cn(
              index === step && !("later" in item && item.later) ? "text-accent" : undefined,
              "later" in item && item.later ? "opacity-60" : undefined,
            )}
          >
            {String(index + 1).padStart(2, "0")} {item.label}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm text-muted">
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved." : "We save as you go."}
        {brief.projectId ? (
          <>
            {" "}
            <Link href="/dashboard/create" className="underline">
              Back to Ad Studio
            </Link>
          </>
        ) : null}
      </p>

      {isStudioLane(lane ?? "") ? (
        <p className="mt-4 text-sm text-muted">
          {lane === "viral" ? "Viral video" : "Business advert"}. Starring you, for this business.
        </p>
      ) : null}

      {BRIEF_STEPS[step]?.id === "campaign" ? (
        <section className="mt-8 flex flex-col gap-6">
          <h2 className="font-display text-2xl text-foreground">Campaign</h2>
          <div className="flex flex-col gap-2">
            <Label htmlFor="businessId">Which business?</Label>
            <select
              id="businessId"
              className="h-11 rounded-md border border-border bg-surface px-3 text-base text-foreground"
              value={brief.businessId}
              onChange={(event) => patch({ businessId: event.target.value })}
            >
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Campaign title</Label>
            <Input
              id="title"
              value={brief.title}
              onChange={(event) => patch({ title: event.target.value })}
            />
          </div>
          <fieldset>
            <legend className="text-sm font-medium text-foreground">What are we advertising?</legend>
            <OptionList
              options={ADVERTISING_TYPES}
              value={brief.objective}
              onChange={(value) => patch({ objective: value })}
            />
          </fieldset>
        </section>
      ) : null}

      {BRIEF_STEPS[step]?.id === "goal" ? (
        <section className="mt-8 flex flex-col gap-6">
          <h2 className="font-display text-2xl text-foreground">Goal</h2>
          <fieldset>
            <legend className="text-sm font-medium text-foreground">
              What should customers do after watching?
            </legend>
            <OptionList
              options={CTA_TYPES}
              value={brief.ctaType}
              onChange={(value) => patch({ ctaType: value })}
            />
          </fieldset>
          <FieldArea
            id="ctaValue"
            label="Number, link, or extra detail for that action"
            value={brief.ctaValue}
            onChange={(value) => patch({ ctaValue: value })}
          />
          <FieldArea
            id="targetCustomer"
            label="Who are we speaking to?"
            value={brief.targetCustomer}
            onChange={(value) => patch({ targetCustomer: value })}
          />
          <FieldArea
            id="problem"
            label="What problem do they have?"
            value={brief.problem}
            onChange={(value) => patch({ problem: value })}
          />
          <FieldArea
            id="valueProposition"
            label="Why should they choose you?"
            value={brief.valueProposition}
            onChange={(value) => patch({ valueProposition: value })}
          />
          <FieldArea
            id="offer"
            label="Is there an offer?"
            value={brief.offer}
            onChange={(value) => patch({ offer: value })}
          />
          <FieldArea
            id="avoid"
            label="Anything we must avoid saying?"
            value={brief.avoid}
            onChange={(value) => patch({ avoid: value })}
          />
        </section>
      ) : null}

      {BRIEF_STEPS[step]?.id === "style" ? (
        <section className="mt-8 flex flex-col gap-6">
          <h2 className="font-display text-2xl text-foreground">Style</h2>
          <fieldset>
            <legend className="text-sm font-medium text-foreground">Visual style</legend>
            <OptionList options={AD_STYLES} value={brief.style} onChange={(value) => patch({ style: value })} />
          </fieldset>
          <fieldset>
            <legend className="text-sm font-medium text-foreground">How should you come across?</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {TONE_OPTIONS.map((tone) => {
                const selected = brief.tones.includes(tone);
                return (
                  <button
                    key={tone}
                    type="button"
                    className={cn(
                      "min-h-11 rounded-md border px-3 text-sm",
                      selected ? "border-accent text-foreground" : "border-border text-muted",
                    )}
                    onClick={() =>
                      patch({
                        tones: selected
                          ? brief.tones.filter((item) => item !== tone)
                          : [...brief.tones, tone],
                      })
                    }
                  >
                    {tone}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </section>
      ) : null}

      {BRIEF_STEPS[step]?.id === "format" ? (
        <section className="mt-8 flex flex-col gap-6">
          <h2 className="font-display text-2xl text-foreground">Format</h2>
          <fieldset>
            <legend className="text-sm font-medium text-foreground">Where will your advert run?</legend>
            <OptionList
              options={PLATFORMS}
              value={brief.platform}
              onChange={(value) => patch({ platform: value })}
            />
          </fieldset>
          {recommended ? (
            <p className="text-sm text-muted">Recommended: {recommended}. Choose it below if you agree.</p>
          ) : null}
          <fieldset>
            <legend className="text-sm font-medium text-foreground">Aspect ratio</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {ASPECT_RATIOS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={cn(
                    "min-h-11 rounded-md border px-3 text-sm",
                    brief.aspectRatio === item.value
                      ? "border-accent text-foreground"
                      : "border-border text-muted",
                  )}
                  onClick={() => patch({ aspectRatio: item.value })}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-medium text-foreground">Duration</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {DURATIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={cn(
                    "min-h-11 rounded-md border px-3 text-sm",
                    brief.duration === item ? "border-accent text-foreground" : "border-border text-muted",
                  )}
                  onClick={() => patch({ duration: item })}
                >
                  {item} seconds
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted">We film the length you pick.</p>
          </fieldset>
        </section>
      ) : null}

      {BRIEF_STEPS[step]?.id === "references" ? (
        <ReferencesStep
          brief={brief}
          library={library}
          viral={lane === "viral"}
          onError={setError}
          onChange={(references) => patch({ references }, false)}
        />
      ) : null}

      {BRIEF_STEPS[step]?.id === "concept" ? (
        <ConceptPanel
          projectId={brief.projectId}
          brief={brief}
          initial={concept}
          onError={setError}
          persist={persist}
          onConcept={(next) => setLocked(next.approved)}
          credits={credits}
        />
      ) : null}

      {error ? <p className="mt-6 text-sm text-danger">{error}</p> : null}

      <div className="mt-10 flex flex-wrap gap-3">
        {step > 0 ? (
          <Button type="button" variant="outline" onClick={() => setStep((value) => value - 1)}>
            Back
          </Button>
        ) : null}
        {step < BRIEF_STEPS.length - 1 ? (
          <Button type="button" onClick={() => goNext()}>
            Continue
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function OptionList({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={cn(
            "min-h-11 rounded-md border px-3 text-sm",
            value === option ? "border-accent text-foreground" : "border-border text-muted",
          )}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function FieldArea({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-24 w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-foreground placeholder:text-muted"
      />
    </div>
  );
}

function ReferencesStep({
  brief,
  library,
  viral,
  onError,
  onChange,
}: {
  brief: WizardBrief;
  library: { id: string; role: string; mimeType: string }[];
  viral?: boolean;
  onError: (value: string | null) => void;
  onChange: (references: WizardBrief["references"]) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const available = library.filter((item) => !brief.references.some((ref) => ref.assetId === item.id));

  async function onUpload(file: File | undefined) {
    onError(null);
    if (!file || !brief.projectId) {
      onError("Save the campaign name first, then add photos.");
      return;
    }
    if (brief.references.length >= CONTEXT_REFERENCE_LIMIT) {
      onError("You can add up to 6 extra photos for this campaign.");
      return;
    }
    if (file.size > LIBRARY_MAX_BYTES) {
      onError("That photo is too large. Keep it under 8 MB.");
      return;
    }
    setPending(true);
    setProgress(0);
    try {
      await uploadSignedFile({
        signUrl: `/api/projects/${brief.projectId}/references/uploads`,
        completeUrl: `/api/projects/${brief.projectId}/references/complete`,
        file,
        mimeType: file.type,
        onProgress: setProgress,
      });
      router.refresh();
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Upload failed. You can retry.");
    } finally {
      setPending(false);
    }
  }

  async function onAttach(assetId: string) {
    if (!brief.projectId) {
      onError("Save the campaign name first, then add photos.");
      return;
    }
    setPending(true);
    const result = await attachLibraryReferenceAction({ projectId: brief.projectId, assetId });
    setPending(false);
    if (result.error) {
      onError(result.error);
      return;
    }
    router.refresh();
  }

  async function onRemove(referenceId: string) {
    if (!brief.projectId) {
      return;
    }
    setPending(true);
    const result = await removeReferenceAction({ projectId: brief.projectId, referenceId });
    setPending(false);
    if (result.error) {
      onError(result.error);
      return;
    }
    onChange(brief.references.filter((item) => item.id !== referenceId));
    router.refresh();
  }

  return (
    <section className="mt-8 flex flex-col gap-6">
      <h2 className="font-display text-2xl text-foreground">References</h2>
      <p className="text-muted">
        {viral
          ? STUDIO_VIRAL_HINT
          : "Optional. Up to 6 extra photos — product, shop, vehicle, or similar. Your private identity photos are not used here."}
      </p>
      <div>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border px-4 text-sm text-foreground">
          {pending ? <Spinner className="size-4" /> : null}
          {pending ? "Uploading…" : "Upload photo"}
          <input
            type="file"
            accept={libraryAcceptAttribute("campaign")}
            className="hidden"
            disabled={pending || !brief.projectId}
            onChange={(event) => void onUpload(event.target.files?.[0])}
          />
        </label>
        {pending && progress !== null ? <p className="mt-2 text-sm text-muted">Uploading {progress}%</p> : null}
      </div>
      {brief.references.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-3">
          {brief.references.map((item) => (
            <li key={item.id} className="rounded-lg border border-border bg-surface p-3">
              <MediaPreview
                src={`/api/media/assets/${item.assetId}/play`}
                alt=""
                className="max-h-32 w-full rounded-md bg-surface-secondary object-contain"
              />
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                busy={pending}
                onClick={() => onRemove(item.id)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No extra photos yet. You can skip this step.</p>
      )}
      {available.length > 0 ? (
        <div>
          <p className="text-sm font-medium text-foreground">From your media library</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {available.map((item) => (
              <li key={item.id} className="rounded-lg border border-border bg-surface p-3">
                <MediaPreview
                  src={`/api/media/assets/${item.id}/play`}
                  alt=""
                  className="max-h-24 w-full rounded-md bg-surface-secondary object-contain"
                />
                <p className="mt-2 text-sm text-muted">{item.role}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  busy={pending}
                  onClick={() => onAttach(item.id)}
                >
                  Use photo
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
