"use client";

import { useState } from "react";
import { DisabledAction } from "@/components/dashboard/disabled-action";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import type { ConceptScene, PublicCreativeConcept } from "@/lib/ai/creative-director";
import { produceHoldReason } from "@/lib/credits";
import {
  CONCEPT_APPROVE,
  CONCEPT_APPROVING,
  CONCEPT_CANCEL_EDIT,
  CONCEPT_CREATE,
  CONCEPT_CREATING,
  CONCEPT_CTA_LABEL,
  CONCEPT_EDIT,
  CONCEPT_HEADING,
  CONCEPT_HOOK_LABEL,
  CONCEPT_NEW,
  CONCEPT_SAVE_EDITS,
  CONCEPT_SAVING,
  CONCEPT_SPOKEN_LABEL,
  CONCEPT_STRATEGY_LABEL,
  CONCEPT_TIMELINE_LABEL,
  PRODUCE_UNAVAILABLE,
} from "@/lib/creative/copy";
import { PRODUCE_COMMERCIAL, PRODUCING } from "@/lib/production/copy";
import { formatSceneRange } from "@/lib/creative/public";
import { briefReadyForConcept } from "@/lib/projects/save";

export function ConceptPanel({
  projectId,
  brief,
  initial,
  onError,
  persist,
  onConcept,
  credits,
  showProduce = true,
}: {
  projectId: string | null;
  brief: {
    title: string;
    objective: string;
    ctaType: string;
    style: string;
    platform: string;
    aspectRatio: string;
    duration: number;
  };
  initial: PublicCreativeConcept | null;
  onError: (value: string | null) => void;
  persist: () => Promise<{ projectId?: string | null; error?: string }>;
  onConcept?: (concept: PublicCreativeConcept) => void;
  credits: number;
  showProduce?: boolean;
}) {
  const [concept, setConcept] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState<"idle" | "generate" | "edit" | "approve" | "produce">("idle");
  const [draft, setDraft] = useState<PublicCreativeConcept | null>(initial);
  const [savedProjectId, setSavedProjectId] = useState(projectId);

  const ready = briefReadyForConcept(brief);
  const activeProjectId = savedProjectId ?? projectId;

  async function postJson(url: string, body: unknown) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { concept?: PublicCreativeConcept; error?: string };
    if (!response.ok || !payload.concept) {
      throw new Error(payload.error || "We couldn't complete that.");
    }
    return payload.concept;
  }

  function applyConcept(next: PublicCreativeConcept) {
    setConcept(next);
    setDraft(next);
    setEditing(false);
    onConcept?.(next);
  }

  async function onGenerate() {
    onError(null);
    const saved = await persist();
    if (saved.error) {
      onError(saved.error);
      return;
    }
    const id = saved.projectId ?? projectId;
    if (!id) {
      onError("Save the brief before creating a concept.");
      return;
    }
    setSavedProjectId(id);
    setPending("generate");
    try {
      const next = await postJson("/api/creative/generate", { projectId: id });
      applyConcept(next);
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "We couldn't create a concept right now.");
    } finally {
      setPending("idle");
    }
  }

  async function onSaveEdits() {
    if (!concept || !draft || !activeProjectId) {
      return;
    }
    onError(null);
    setPending("edit");
    try {
      const next = await postJson("/api/creative/edit", {
        projectId: activeProjectId,
        hook: draft.hook,
        strategy: draft.strategy,
        spokenScript: draft.spokenScript,
        scenes: draft.scenes,
        callToAction: draft.callToAction,
      });
      applyConcept(next);
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "We couldn't save those changes.");
    } finally {
      setPending("idle");
    }
  }

  async function onApprove() {
    if (!concept || !activeProjectId) {
      return;
    }
    onError(null);
    setPending("approve");
    try {
      const next = await postJson("/api/creative/approve", {
        projectId: activeProjectId,
        versionId: concept.versionId,
      });
      applyConcept(next);
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "We couldn't approve that concept.");
    } finally {
      setPending("idle");
    }
  }

  async function onProduce() {
    if (!activeProjectId) {
      return;
    }
    onError(null);
    setPending("produce");
    try {
      const response = await fetch("/api/production/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: activeProjectId }),
      });
      const payload = (await response.json()) as { projectId?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "We couldn't start filming.");
      }
      window.location.href = "/dashboard/create?new=1";
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "We couldn't start filming.");
      setPending("idle");
    }
  }

  return (
    <section className="relative mt-5 flex flex-col gap-5 lg:mt-8 lg:gap-6">
      {pending !== "idle" ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-background/80 backdrop-blur-sm">
          <Spinner className="size-10" />
          <p className="text-sm text-muted">
            {pending === "generate"
              ? CONCEPT_CREATING
              : pending === "produce"
                ? PRODUCING
                : pending === "approve"
                  ? CONCEPT_APPROVING
                  : CONCEPT_SAVING}
          </p>
        </div>
      ) : null}
      <h2 className="font-display text-xl text-foreground lg:text-2xl">{CONCEPT_HEADING}</h2>
      {!ready.ready ? <p className="text-muted">{ready.reason}</p> : null}
      {!concept ? (
        <div>
          <Button type="button" className="w-full sm:w-auto" disabled={!ready.ready} busy={pending === "generate"} onClick={() => onGenerate()}>
            {CONCEPT_CREATE}
          </Button>
        </div>
      ) : editing && draft ? (
        <EditFields
          draft={draft}
          pending={pending !== "idle"}
          onChange={setDraft}
          onCancel={() => {
            setDraft(concept);
            setEditing(false);
          }}
          onSave={() => onSaveEdits()}
        />
      ) : (
        <ConceptReadout concept={concept} />
      )}
      {concept && !editing ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={pending !== "idle"}
            onClick={() => {
              setDraft(concept);
              setEditing(true);
            }}
          >
            {CONCEPT_EDIT}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={!ready.ready}
            busy={pending === "generate"}
            onClick={() => onGenerate()}
          >
            {pending === "generate" ? CONCEPT_CREATING : CONCEPT_NEW}
          </Button>
          {concept.approved ? (
            showProduce ? (
              credits < 1 ? (
                <DisabledAction label={PRODUCE_COMMERCIAL} reason={produceHoldReason(credits, PRODUCE_UNAVAILABLE)} />
              ) : (
                <Button type="button" className="w-full sm:w-auto" busy={pending === "produce"} onClick={() => onProduce()}>
                  {pending === "produce" ? PRODUCING : PRODUCE_COMMERCIAL}
                </Button>
              )
            ) : (
              <p className="self-center text-sm text-muted">Script approved. Choose Next to generate the video.</p>
            )
          ) : (
            <Button type="button" className="w-full sm:w-auto" busy={pending === "approve"} onClick={() => onApprove()}>
              {pending === "approve" ? CONCEPT_APPROVING : CONCEPT_APPROVE}
            </Button>
          )}
        </div>
      ) : null}
    </section>
  );
}

function ConceptReadout({ concept }: { concept: PublicCreativeConcept }) {
  return (
    <dl className="flex flex-col gap-6">
      <Field label={CONCEPT_HOOK_LABEL} value={concept.hook} />
      <Field label={CONCEPT_STRATEGY_LABEL} value={concept.strategy} />
      <Field label={CONCEPT_SPOKEN_LABEL} value={concept.spokenScript} />
      <div>
        <dt className="text-sm font-medium text-foreground">{CONCEPT_TIMELINE_LABEL}</dt>
        <dd className="mt-3 grid gap-3">
          {concept.scenes.map((scene) => (
            <article key={`${scene.startSecond}-${scene.endSecond}-${scene.visual}`} className="rounded-lg border border-border bg-surface p-4">
              <p className="text-sm text-accent">
                {formatSceneRange(scene.startSecond, scene.endSecond)} seconds
              </p>
              <p className="mt-2 text-foreground">{scene.visual}</p>
              {scene.dialogue ? <p className="mt-2 text-muted">{scene.dialogue}</p> : null}
            </article>
          ))}
        </dd>
      </div>
      <Field label={CONCEPT_CTA_LABEL} value={concept.callToAction} />
    </dl>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-foreground">{label}</dt>
      <dd className="mt-2 whitespace-pre-wrap text-foreground">{value}</dd>
    </div>
  );
}

function EditFields({
  draft,
  pending,
  onChange,
  onCancel,
  onSave,
}: {
  draft: PublicCreativeConcept;
  pending: boolean;
  onChange: (value: PublicCreativeConcept) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  function patch(next: Partial<PublicCreativeConcept>) {
    onChange({ ...draft, ...next });
  }

  function patchScene(index: number, next: Partial<ConceptScene>) {
    patch({
      scenes: draft.scenes.map((scene, sceneIndex) =>
        sceneIndex === index ? { ...scene, ...next } : scene,
      ),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <EditArea label={CONCEPT_HOOK_LABEL} value={draft.hook} onChange={(hook) => patch({ hook })} />
      <EditArea
        label={CONCEPT_STRATEGY_LABEL}
        value={draft.strategy}
        onChange={(strategy) => patch({ strategy })}
      />
      <EditArea
        label={CONCEPT_SPOKEN_LABEL}
        value={draft.spokenScript}
        onChange={(spokenScript) => patch({ spokenScript })}
      />
      <div>
        <p className="text-sm font-medium text-foreground">{CONCEPT_TIMELINE_LABEL}</p>
        <div className="mt-3 grid gap-4">
          {draft.scenes.map((scene, index) => (
            <div key={`${scene.startSecond}-${index}`} className="rounded-lg border border-border bg-surface p-4">
              <p className="text-sm text-accent">{formatSceneRange(scene.startSecond, scene.endSecond)} seconds</p>
              <EditArea
                label="Visual"
                value={scene.visual}
                onChange={(visual) => patchScene(index, { visual })}
              />
              <EditArea
                label="Spoken in this scene"
                value={scene.dialogue ?? ""}
                onChange={(dialogue) => patchScene(index, { dialogue })}
              />
            </div>
          ))}
        </div>
      </div>
      <EditArea
        label={CONCEPT_CTA_LABEL}
        value={draft.callToAction}
        onChange={(callToAction) => patch({ callToAction })}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button type="button" className="w-full sm:w-auto" busy={pending} onClick={onSave}>
          {pending ? CONCEPT_SAVING : CONCEPT_SAVE_EDITS}
        </Button>
        <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={pending} onClick={onCancel}>
          {CONCEPT_CANCEL_EDIT}
        </Button>
      </div>
    </div>
  );
}

function EditArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="mt-3 flex flex-col gap-2">
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
