"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { saveBriefAction } from "@/app/dashboard/create/actions";
import { ExtraRefsUploader } from "@/components/create/extra-refs";
import { ConceptPanel } from "@/components/create/concept-panel";
import { LogoUploader } from "@/components/brand/logo-uploader";
import { DisabledAction } from "@/components/dashboard/disabled-action";
import { IdentityCapture } from "@/components/identity/identity-capture";
import { IdentityConsentForm } from "@/components/identity/consent-form";
import { MediaPreview, privateAssetSrc } from "@/components/media/preview";
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
  CTA_TYPES,
  DURATIONS,
  PLATFORMS,
  recommendedAspectRatio,
  requireExplicitAspectRatio,
  titleFromPrompt,
} from "@/lib/projects/brief";
import { CREATE_BODY, SIMPLE_WIZARD_STEPS } from "@/lib/projects/copy";
import { briefReadyForConcept } from "@/lib/projects/save";
import { identitySlotsFilled } from "@/lib/identity/queries";
import { IDENTITY_REQUIRED, IDENTITY_UPLOAD_REQUIRED, PRODUCE_COMMERCIAL, PRODUCING } from "@/lib/production/copy";
import type { IdentityRole } from "@/lib/r2/keys";
import { cn } from "@/lib/utils";
import type { WizardBrief } from "@/components/create/wizard";

type IdentityAssetMap = Partial<Record<IdentityRole, { assetId: string; mimeType: string }>>;

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
  freshStart = false,
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
  identityAssets: IdentityAssetMap;
  brand: { id: string; logoAssetId: string | null } | null;
  canEditBrand: boolean;
  extrasWrite: { allowed: true } | { allowed: false; reason: string };
  freshStart?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [mode, setMode] = useState<"saved" | "upload" | null>(null);
  const [uploadAssets, setUploadAssets] = useState<IdentityAssetMap>({});
  const [brief, setBrief] = useState(initial);
  const [locked, setLocked] = useState(briefLocked);
  const [liveConcept, setLiveConcept] = useState(concept);
  const [approved, setApproved] = useState(Boolean(concept?.approved));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [producing, setProducing] = useState(false);
  const [profilePane, setProfilePane] = useState<"film" | "extras">("film");
  const [formatOpen, setFormatOpen] = useState<"shape" | "length" | null>(null);
  const timer = useRef<number | null>(null);
  const briefRef = useRef(brief);
  const wasFresh = useRef(false);
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

  useEffect(() => {
    if (freshStart && !wasFresh.current) {
      setStep(0);
      setMode(null);
      setUploadAssets({});
      setBrief(initial);
      setLocked(false);
      setLiveConcept(null);
      setApproved(false);
      setProducing(false);
      setError(null);
    }
    wasFresh.current = freshStart;
  }, [freshStart, initial]);

  useEffect(() => {
    if (freshStart) {
      return;
    }
    setBrief((currentBrief) =>
      initial.projectId && initial.projectId !== currentBrief.projectId
        ? { ...currentBrief, projectId: initial.projectId }
        : currentBrief,
    );
  }, [freshStart, initial.projectId]);

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
    setStatus("saved");
    setError(null);
    return result;
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
      if (!mode) {
        setError("Choose a saved Reference Profile, or upload new photos and video for this advert.");
        return;
      }
      if (mode === "saved") {
        if (!profileReady) {
          setError(IDENTITY_REQUIRED);
          return;
        }
      } else if (!identitySlotsFilled(uploadAssets)) {
        setError(IDENTITY_UPLOAD_REQUIRED);
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
    <div className="pb-28 lg:pb-0">
      <ol className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 text-xs tracking-[0.12em] text-muted lg:flex-wrap lg:overflow-visible">
        {SIMPLE_WIZARD_STEPS.map((item, index) => (
          <li
            key={item.id}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5",
              index === step ? "border-accent text-foreground" : "border-border",
            )}
          >
            {String(index + 1).padStart(2, "0")} {item.label}
          </li>
        ))}
      </ol>
      <p className="mt-3 hidden text-sm text-muted lg:block">
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
      <p className="mt-2 text-xs text-muted lg:hidden">
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved." : null}
        {brief.projectId ? (
          <Link href="/dashboard/create?new=1" className="ml-2 underline">
            New advert
          </Link>
        ) : null}
      </p>

      {current?.id === "profile" ? (
        <section className="mt-5 flex flex-col gap-5 lg:mt-8 lg:gap-6">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-surface-secondary p-1 lg:hidden">
            <PaneTab selected={profilePane === "film"} onClick={() => setProfilePane("film")}>
              Who we film
            </PaneTab>
            <PaneTab selected={profilePane === "extras"} onClick={() => setProfilePane("extras")}>
              Extra photos
            </PaneTab>
          </div>
          <div className={cn(profilePane === "film" ? "contents" : "hidden lg:contents")}>
          <h2 className="font-display text-xl text-foreground lg:text-2xl">Who should we film?</h2>
          <p className="text-sm text-muted lg:text-base">
            We do not assume your saved profile. Choose it for this advert, or upload a new selfie
            video and face photos.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <ChoiceCard
              selected={mode === "saved"}
              disabled={!profileReady}
              title="Use a saved Reference Profile"
              body={
                profileReady
                  ? "Film this advert with the selfie video and face photos you already uploaded."
                  : "No saved profile yet. Upload new files, or finish Reference Profile first."
              }
              onClick={() => setMode("saved")}
            />
            <ChoiceCard
              selected={mode === "upload"}
              title="Upload new photos or video"
              body="Add a new selfie video and face photos for this advert. You can still pick extra photos below."
              onClick={() => {
                setMode("upload");
                setUploadAssets({});
              }}
            />
          </div>
          {mode === "saved" && profileReady ? (
            <SavedProfilePreview assets={identityAssets} />
          ) : null}
          {mode === "upload" ? (
            !consented ? (
              <IdentityConsentForm />
            ) : (
              <div id="identity-capture">
                <IdentityCapture
                  firstName={firstName}
                  businessName={businessName}
                  assets={uploadAssets}
                  onSlotSaved={(role, asset) =>
                    setUploadAssets((currentAssets) => ({ ...currentAssets, [role]: asset }))
                  }
                />
              </div>
            )
          ) : null}
          {brand && mode ? (
            <div>
              <h3 className="font-display text-lg text-foreground lg:text-xl">Logo</h3>
              <div className="mt-3 lg:mt-4">
                <LogoUploader
                  businessId={brand.id}
                  logoAssetId={brand.logoAssetId}
                  canEdit={canEditBrand}
                />
              </div>
            </div>
          ) : null}
          </div>
          <div className={cn(profilePane === "extras" ? "contents" : "hidden lg:contents")}>
          <ExtraRefsUploader
            canWrite={extrasWrite.allowed}
            writeReason={extrasWrite.allowed ? null : extrasWrite.reason}
            items={library}
            projectId={brief.projectId}
            selected={brief.references.map((item) => ({ id: item.id, assetId: item.assetId }))}
            ensureProject={async () => {
              const saved = await persist();
              return saved.projectId ?? briefRef.current.projectId;
            }}
            onSelected={(next) =>
              patch(
                {
                  references: next.map((item) => ({
                    id: item.id,
                    assetId: item.assetId,
                    source: "library" as const,
                  })),
                },
                false,
              )
            }
          />
          </div>
        </section>
      ) : null}

      {current?.id === "script" ? (
        <section className="mt-5 flex flex-col gap-5 lg:mt-8 lg:gap-6">
          <h2 className="font-display text-xl text-foreground lg:text-2xl">Write your script</h2>
          <p className="hidden text-muted lg:block">
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
              className="min-h-36 w-full rounded-2xl border-2 border-accent bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted lg:min-h-40 lg:rounded-md lg:border lg:border-border lg:px-3 lg:py-2"
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
          <div className="grid grid-cols-2 gap-2 lg:hidden">
            <ConfigPill
              selected={formatOpen === "shape"}
              onClick={() => setFormatOpen((currentOpen) => (currentOpen === "shape" ? null : "shape"))}
            >
              {brief.aspectRatio || "Shape"}
            </ConfigPill>
            <ConfigPill
              selected={formatOpen === "length"}
              onClick={() => setFormatOpen((currentOpen) => (currentOpen === "length" ? null : "length"))}
            >
              {brief.duration}s
            </ConfigPill>
          </div>
          {formatOpen === "shape" ? (
            <div className="flex flex-wrap gap-2 lg:hidden">
              {ASPECT_RATIOS.map((item) => (
                <Chip
                  key={item.value}
                  selected={brief.aspectRatio === item.value}
                  onClick={() => {
                    patch({ aspectRatio: item.value });
                    setFormatOpen(null);
                  }}
                >
                  {item.value}
                </Chip>
              ))}
            </div>
          ) : null}
          {formatOpen === "length" ? (
            <div className="flex flex-wrap gap-2 lg:hidden">
              {DURATIONS.map((item) => (
                <Chip
                  key={item}
                  selected={brief.duration === item}
                  onClick={() => {
                    patch({ duration: item });
                    setFormatOpen(null);
                  }}
                >
                  {item}s
                </Chip>
              ))}
            </div>
          ) : null}
          <fieldset className="hidden lg:block">
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
          <fieldset className="hidden lg:block">
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
            <p className="mt-2 text-sm text-muted">We film the length you pick.</p>
          </fieldset>
        </section>
      ) : null}

      {current?.id === "approve" ? (
        <ConceptPanel
          projectId={brief.projectId}
          brief={brief}
          initial={liveConcept}
          onError={setError}
          persist={persist}
          onConcept={(next) => {
            setLiveConcept(next);
            setLocked(next.approved);
            setApproved(next.approved);
          }}
          credits={credits}
          showProduce={false}
        />
      ) : null}

      {current?.id === "generate" ? (
        <section className="mt-5 flex flex-col gap-4 lg:mt-8 lg:gap-6">
          <h2 className="font-display text-xl text-foreground lg:text-2xl">Generate video</h2>
          <p className="text-sm text-muted lg:text-base">
            This uses 1 Ad Credit. A loading card appears under Your videos and becomes your
            commercial when filming finishes.
          </p>
          {!approved ? (
            <p className="text-muted">Approve the script first, then we can film.</p>
          ) : credits < 1 ? (
            <DisabledAction
              label={PRODUCE_COMMERCIAL}
              reason={produceHoldReason(credits, PRODUCE_UNAVAILABLE)}
            />
          ) : (
            <div className="hidden lg:block">
              <Button type="button" busy={producing} onClick={() => onProduce()}>
                {producing ? PRODUCING : PRODUCE_COMMERCIAL}
              </Button>
            </div>
          )}
        </section>
      ) : null}

      {error ? <p className="mt-4 text-sm text-danger lg:mt-6">{error}</p> : null}

      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 border-t border-border bg-background px-4 py-3 lg:static lg:bottom-auto lg:mt-10 lg:border-0 lg:bg-transparent lg:p-0">
        <div className="flex gap-3">
          {step > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="flex-1 lg:flex-none"
              onClick={() => setStep((value) => value - 1)}
            >
              Back
            </Button>
          ) : null}
          {step < SIMPLE_WIZARD_STEPS.length - 1 ? (
            <Button type="button" className="flex-1 lg:flex-none" onClick={() => goNext()}>
              Next
            </Button>
          ) : current?.id === "generate" && approved && credits >= 1 ? (
            <Button type="button" className="flex-1 lg:hidden" busy={producing} onClick={() => onProduce()}>
              {producing ? PRODUCING : PRODUCE_COMMERCIAL}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SavedProfilePreview({
  assets,
}: {
  assets: Partial<Record<IdentityRole, { assetId: string; mimeType: string }>>;
}) {
  const slots: Array<{ role: IdentityRole; label: string }> = [
    { role: "IDENTITY_VIDEO", label: "Selfie video" },
    { role: "IDENTITY_FRONT", label: "Front" },
    { role: "IDENTITY_LEFT", label: "Left" },
    { role: "IDENTITY_RIGHT", label: "Right" },
  ];
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="text-muted">These saved files will be used if you choose Next.</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {slots.map((slot) => {
          const asset = assets[slot.role];
          return (
            <li key={slot.role} className="rounded-md border border-border p-3">
              <p className="mb-2 text-sm text-foreground">{slot.label}</p>
              {asset ? (
                <MediaPreview
                  src={privateAssetSrc(asset.assetId)}
                  mimeType={asset.mimeType}
                  alt=""
                  className="max-h-36 w-full rounded-md bg-surface-secondary object-contain"
                />
              ) : (
                <p className="text-sm text-muted">Missing</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PaneTab({
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
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-full px-3 text-sm",
        selected ? "bg-surface text-foreground" : "text-muted",
      )}
    >
      {children}
    </button>
  );
}

function ConfigPill({
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
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-full border px-3 text-sm",
        selected ? "border-accent text-foreground" : "border-border text-muted",
      )}
    >
      {children}
    </button>
  );
}

function ChoiceCard({
  selected,
  disabled,
  title,
  body,
  onClick,
}: {
  selected: boolean;
  disabled?: boolean;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-2xl border p-4 text-left lg:p-5",
        selected ? "border-accent bg-surface" : "border-border bg-surface",
        disabled ? "cursor-not-allowed opacity-60" : undefined,
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
        "min-h-11 rounded-full border px-3 text-sm",
        selected ? "border-accent text-foreground" : "border-border text-muted",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
