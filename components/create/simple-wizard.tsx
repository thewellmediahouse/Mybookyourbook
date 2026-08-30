"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { attachLibraryReferenceAction, saveBriefAction } from "@/app/dashboard/create/actions";
import { ExtraRefsUploader } from "@/components/create/extra-refs";
import { ConceptPanel } from "@/components/create/concept-panel";
import { LogoUploader } from "@/components/brand/logo-uploader";
import { DisabledAction } from "@/components/dashboard/disabled-action";
import { IdentityCapture } from "@/components/identity/identity-capture";
import { IdentityConsentForm } from "@/components/identity/consent-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PublicCreativeConcept } from "@/lib/ai/creative-director";
import { produceHoldReason } from "@/lib/credits/copy";
import { PRODUCE_UNAVAILABLE } from "@/lib/creative/copy";
import {
  AD_STYLES,
  ADVERTISING_TYPES,
  ASPECT_RATIOS,
  CONTEXT_REFERENCE_LIMIT,
  CTA_TYPES,
  DEFAULT_DURATION,
  DURATIONS,
  PLATFORMS,
  recommendedAspectRatio,
  requireExplicitAspectRatio,
  titleFromPrompt,
} from "@/lib/projects/brief";
import { CREATE_BODY, SIMPLE_WIZARD_STEPS } from "@/lib/projects/copy";
import { briefReadyForConcept } from "@/lib/projects/save";
import { IDENTITY_REQUIRED, PRODUCE_COMMERCIAL, PRODUCING } from "@/lib/production/copy";
import type { IdentityRole } from "@/lib/r2/keys";
import { cn } from "@/lib/utils";
import type { WizardBrief } from "@/components/create/wizard";

export function SimpleCreateWizard({
  initial,
  brands,
  library,
  concept,
  briefLocked,
  credits,
  initialStep,
  profileReady,
  consented,
  firstName,
  businessName,
  identityAssets,
  brand,
  canEditBrand,
  extrasWrite,
}: {
  initial: WizardBrief;
  brands: { id: string; name: string }[];
  library: { id: string; role: string; mimeType: string }[];
  concept: PublicCreativeConcept | null;
  briefLocked: boolean;
  credits: number;
  initialStep: number;
  profileReady: boolean;
  consented: boolean;
  firstName: string;
  businessName: string;
  identityAssets: Partial<Record<IdentityRole, { assetId: string; mimeType: string }>>;
  brand: { id: string; logoAssetId: string | null } | null;
  canEditBrand: boolean;
  extrasWrite: { allowed: true } | { allowed: false; reason: string };
}) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [mode, setMode] = useState<"saved" | "upload">(profileReady ? "saved" : "upload");
  const [brief, setBrief] = useState(initial);
  const [locked, setLocked] = useState(briefLocked);
  const [approved, setApproved] = useState(Boolean(concept?.approved));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [producing, setProducing] = useState(false);
  const timer = useRef<number | null>(null);
  const briefRef = useRef(brief);
  briefRef.current = brief;

  const prompt = brief.problem || brief.valueProposition;
  const ready = briefReadyForConcept(brief);
  const current = SIMPLE_WIZARD_STEPS[step];

  useEffect(() => {
    return () => {
      if (timer.current) {
        window.clearTimeout(timer.current);
      }
    };
  }, []);

  function patch(next: Partial<WizardBrief>, autosave = true) {
    setBrief((currentBrief) => {
      const merged = { ...currentBrief, ...next };
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

  async function persist(currentBrief = briefRef.current) {
    if (locked) {
      return { projectId: currentBrief.projectId, error: undefined as string | undefined };
    }
    if (!currentBrief.businessId && brands.length !== 1) {
      return { projectId: currentBrief.projectId, error: undefined as string | undefined };
    }
    setStatus("saving");
    const result = await saveBriefAction({
      projectId: currentBrief.projectId,
      businessId: currentBrief.businessId || brands[0]?.id,
      title: currentBrief.title,
      objective: currentBrief.objective,
      targetCustomer: currentBrief.targetCustomer,
      problem: currentBrief.problem,
      valueProposition: currentBrief.valueProposition,
      offer: currentBrief.offer,
      ctaType: currentBrief.ctaType,
      ctaValue: currentBrief.ctaValue,
      style: currentBrief.style,
      tones: currentBrief.tones,
      avoid: currentBrief.avoid,
      platform: currentBrief.platform,
      aspectRatio: currentBrief.aspectRatio,
      duration: currentBrief.duration,
    });
    if (result.error) {
      setStatus("error");
      setError(result.error);
      return result;
    }
    if (result.projectId && result.projectId !== currentBrief.projectId) {
      setBrief((item) => ({ ...item, projectId: result.projectId ?? item.projectId }));
      router.replace(`/dashboard/create?project=${result.projectId}`);
    }
    if (result.projectId) {
      await attachSavedExtras(result.projectId, currentBrief);
    }
    setStatus("saved");
    setError(null);
    return result;
  }

  async function attachSavedExtras(projectId: string, currentBrief: WizardBrief) {
    const attached = new Set(currentBrief.references.map((item) => item.assetId));
    let remaining = CONTEXT_REFERENCE_LIMIT - attached.size;
    for (const item of library) {
      if (remaining <= 0) {
        break;
      }
      if (attached.has(item.id)) {
        continue;
      }
      const result = await attachLibraryReferenceAction({ projectId, assetId: item.id });
      if (!result.error) {
        attached.add(item.id);
        remaining -= 1;
      }
    }
  }

  function setPrompt(value: string) {
    const named = brief.title.trim() && brief.title !== "Untitled commercial";
    patch({
      problem: value,
      valueProposition: value,
      title: named ? brief.title : titleFromPrompt(value),
    });
  }

  async function goNext() {
    setError(null);
    if (current?.id === "profile") {
      if (!profileReady) {
        setError(IDENTITY_REQUIRED);
        return;
      }
      setStep(1);
      return;
    }
    if (current?.id === "script") {
      if (!prompt.trim()) {
        setError("Tell us what this advert should say and show.");
        return;
      }
      try {
        requireExplicitAspectRatio(brief.aspectRatio);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Choose an aspect ratio.");
        return;
      }
      if (!ready.ready) {
        setError(ready.reason);
        return;
      }
      const saved = await persist();
      if (saved.error) {
        return;
      }
      setStep(2);
      return;
    }
    if (current?.id === "approve") {
      if (!approved) {
        setError("Approve the script before we film.");
        return;
      }
      setStep(3);
    }
  }

  async function onProduce() {
    if (!brief.projectId) {
      return;
    }
    setError(null);
    setProducing(true);
    try {
      const response = await fetch("/api/production/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: brief.projectId }),
      });
      const payload = (await response.json()) as { projectId?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "We couldn't start filming.");
      }
      router.replace("/dashboard/create?new=1");
      router.refresh();
      setProducing(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't start filming.");
      setProducing(false);
    }
  }

  const recommended = recommendedAspectRatio(brief.platform);

  return (
    <div>
      <ol className="flex flex-wrap gap-2 text-xs tracking-[0.18em] text-muted">
        {SIMPLE_WIZARD_STEPS.map((item, index) => (
          <li key={item.id} className={index === step ? "text-accent" : undefined}>
            {String(index + 1).padStart(2, "0")} {item.label}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm text-muted">
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved." : CREATE_BODY}
        {brief.projectId ? (
          <>
            {" "}
            <Link href="/dashboard/create?new=1" className="underline">
              Start a new advert
            </Link>
          </>
        ) : null}
      </p>

      {current?.id === "profile" ? (
        <section className="mt-8 flex flex-col gap-6">
          <h2 className="font-display text-2xl text-foreground">Who should we film?</h2>
          <p className="text-muted">
            Use your saved Reference Profile, or upload a selfie video, face photos, logo, and extra
            photos of your business.
          </p>
          {profileReady ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <ChoiceCard
                selected={mode === "saved"}
                title="Use my saved profile"
                body="We will film you from the selfie video, photos, and logo already on your Reference Profile."
                onClick={() => setMode("saved")}
              />
              <ChoiceCard
                selected={mode === "upload"}
                title="Upload new files"
                body="Replace your selfie video, photos, logo, or extra photos for this advert."
                onClick={() => setMode("upload")}
              />
            </div>
          ) : null}
          {mode === "saved" && profileReady ? (
            <p className="rounded-lg border border-border bg-surface p-5 text-muted">
              Your Reference Profile is ready. Choose Next to write the script.
            </p>
          ) : (
            <>
              {!consented ? (
                <IdentityConsentForm />
              ) : (
                <div id="identity-capture">
                  <IdentityCapture
                    firstName={firstName}
                    businessName={businessName}
                    assets={identityAssets}
                  />
                </div>
              )}
              {brand ? (
                <div>
                  <h3 className="font-display text-xl text-foreground">Logo</h3>
                  <div className="mt-4">
                    <LogoUploader
                      businessId={brand.id}
                      logoAssetId={brand.logoAssetId}
                      canEdit={canEditBrand}
                    />
                  </div>
                </div>
              ) : null}
              <ExtraRefsUploader
                canWrite={extrasWrite.allowed}
                writeReason={extrasWrite.allowed ? null : extrasWrite.reason}
                items={library}
              />
            </>
          )}
        </section>
      ) : null}

      {current?.id === "script" ? (
        <section className="mt-8 flex flex-col gap-6">
          <h2 className="font-display text-2xl text-foreground">Write your script</h2>
          <p className="text-muted">
            Tell us what this advert should say and show. Use the suggestions below so we know the
            type, look, and where it will run.
          </p>
          {brands.length > 1 ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="businessId">Which business?</Label>
              <select
                id="businessId"
                className="h-11 rounded-md border border-border bg-surface px-3 text-base text-foreground"
                value={brief.businessId}
                onChange={(event) => patch({ businessId: event.target.value })}
              >
                {brands.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Advert name</Label>
            <Input
              id="title"
              value={brief.title}
              onChange={(event) => patch({ title: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="prompt">What should this advert say and show?</Label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="min-h-40 w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-foreground placeholder:text-muted"
              placeholder="Example: We are a family bakery in Durban. Show warm morning light, fresh bread, and ask people to visit this Saturday."
            />
          </div>
          <SuggestionGroup
            legend="What are we advertising?"
            options={ADVERTISING_TYPES}
            value={brief.objective}
            onChange={(value) => patch({ objective: value })}
          />
          <SuggestionGroup
            legend="What should customers do after watching?"
            options={CTA_TYPES}
            value={brief.ctaType}
            onChange={(value) => patch({ ctaType: value })}
          />
          <SuggestionGroup
            legend="Visual style"
            options={AD_STYLES}
            value={brief.style}
            onChange={(value) => patch({ style: value })}
          />
          <SuggestionGroup
            legend="Where will your advert run?"
            options={PLATFORMS}
            value={brief.platform}
            onChange={(value) => patch({ platform: value })}
          />
          {recommended ? (
            <p className="text-sm text-muted">Recommended: {recommended}. Choose it below if you agree.</p>
          ) : null}
          <fieldset>
            <legend className="text-sm font-medium text-foreground">Shape</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {ASPECT_RATIOS.map((item) => (
                <Chip
                  key={item.value}
                  selected={brief.aspectRatio === item.value}
                  onClick={() => patch({ aspectRatio: item.value })}
                >
                  {item.label}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-medium text-foreground">Length</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {DURATIONS.map((item) => (
                <Chip
                  key={item}
                  selected={brief.duration === item}
                  onClick={() => patch({ duration: item })}
                >
                  {item} seconds
                </Chip>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted">The main commercial we produce is {DEFAULT_DURATION} seconds.</p>
          </fieldset>
        </section>
      ) : null}

      {current?.id === "approve" ? (
        <ConceptPanel
          projectId={brief.projectId}
          brief={brief}
          initial={concept}
          onError={setError}
          persist={persist}
          onConcept={(next) => {
            setLocked(next.approved);
            setApproved(next.approved);
          }}
          credits={credits}
          showProduce={false}
        />
      ) : null}

      {current?.id === "generate" ? (
        <section className="mt-8 flex flex-col gap-6">
          <h2 className="font-display text-2xl text-foreground">Generate video</h2>
          <p className="text-muted">
            This uses 1 Ad Credit. A loading card appears on the right and becomes your video when
            filming finishes.
          </p>
          {!approved ? (
            <p className="text-muted">Approve the script first, then we can film.</p>
          ) : credits < 1 ? (
            <DisabledAction
              label={PRODUCE_COMMERCIAL}
              reason={produceHoldReason(credits, PRODUCE_UNAVAILABLE)}
            />
          ) : (
            <Button type="button" busy={producing} onClick={() => void onProduce()}>
              {producing ? PRODUCING : PRODUCE_COMMERCIAL}
            </Button>
          )}
        </section>
      ) : null}

      {error ? <p className="mt-6 text-sm text-danger">{error}</p> : null}

      <div className="mt-10 flex flex-wrap gap-3">
        {step > 0 ? (
          <Button type="button" variant="outline" onClick={() => setStep((value) => value - 1)}>
            Back
          </Button>
        ) : null}
        {step < SIMPLE_WIZARD_STEPS.length - 1 ? (
          <Button type="button" onClick={() => void goNext()}>
            Next
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function ChoiceCard({
  selected,
  title,
  body,
  onClick,
}: {
  selected: boolean;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border p-5 text-left",
        selected ? "border-accent bg-surface" : "border-border bg-surface",
      )}
    >
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted">{body}</p>
    </button>
  );
}

function SuggestionGroup({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-foreground">{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <Chip key={option} selected={value === option} onClick={() => onChange(option)}>
            {option}
          </Chip>
        ))}
      </div>
    </fieldset>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        "min-h-11 rounded-md border px-3 text-sm",
        selected ? "border-accent text-foreground" : "border-border text-muted",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
