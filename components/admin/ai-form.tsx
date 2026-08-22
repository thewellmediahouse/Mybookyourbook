"use client";

import { useActionState } from "react";
import { saveAiAction, type AdminActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AiSettings } from "@/lib/admin/settings";

const initial: AdminActionState = {};

export function AiSettingsForm({ settings }: { settings: AiSettings }) {
  const [state, action, pending] = useActionState(saveAiAction, initial);
  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <Field name="creativeDirectorProvider" label="Creative Director provider" defaultValue={settings.creativeDirectorProvider} />
      <Field name="creativeDirectorModel" label="Creative Director model" defaultValue={settings.creativeDirectorModel} />
      <Field name="videoProvider" label="Video provider" defaultValue={settings.videoProvider} />
      <Field name="seedanceModelId" label="Seedance model ID" defaultValue={settings.seedanceModelId} />
      <Field name="topazModel" label="Topaz model" defaultValue={settings.topazModel} />
      <Field
        name="maxContextReferences"
        label="Maximum context references"
        defaultValue={String(settings.maxContextReferences)}
        type="number"
      />
      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          name="refundOnTechnicalFailure"
          defaultChecked={settings.refundOnTechnicalFailure}
          className="accent-accent"
        />
        Refund on technical failure
      </label>
      <Button type="submit" busy={pending}>
        Save
      </Button>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-success">{state.message}</p> : null}
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} type={type} />
    </div>
  );
}
