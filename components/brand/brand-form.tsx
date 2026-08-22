"use client";

import { useActionState } from "react";
import { addBrand, saveBrand, type BrandActionState } from "@/app/dashboard/brand/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LOGO_POSITION_LABELS, LOGO_POSITIONS } from "@/lib/businesses/fields";

const initial: BrandActionState = {};

export function BrandForm({
  mode,
  workspaceId,
  businessId,
  values,
  canEdit,
}: {
  mode: "create" | "edit";
  workspaceId?: string;
  businessId?: string;
  canEdit: boolean;
  values: {
    name: string;
    website: string;
    tagline: string;
    phone: string;
    email: string;
    whatsapp: string;
    primaryColor: string;
    secondaryColor: string;
    defaultCta: string;
    defaultLogoPosition: string;
    industry: string;
    city: string;
    description: string;
  };
}) {
  const action = mode === "create" ? addBrand : saveBrand;
  const [state, formAction, pending] = useActionState(action, initial);
  const disabled = !canEdit || pending;

  return (
    <form action={formAction} className="mt-8 flex max-w-xl flex-col gap-4">
      {businessId ? <input type="hidden" name="businessId" value={businessId} /> : null}
      {workspaceId ? <input type="hidden" name="workspaceId" value={workspaceId} /> : null}
      <Field id="name" label="Company name" defaultValue={values.name} required disabled={disabled} />
      <Field id="website" label="Website" defaultValue={values.website} type="url" disabled={disabled} />
      <Field id="tagline" label="Tagline" defaultValue={values.tagline} disabled={disabled} />
      <Field id="phone" label="Phone" defaultValue={values.phone} disabled={disabled} />
      <Field id="email" label="Email" defaultValue={values.email} type="email" disabled={disabled} />
      <Field id="whatsapp" label="WhatsApp" defaultValue={values.whatsapp} disabled={disabled} />
      <Field id="defaultCta" label="Preferred call to action" defaultValue={values.defaultCta} disabled={disabled} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="defaultLogoPosition">Default logo position</Label>
        <select
          id="defaultLogoPosition"
          name="defaultLogoPosition"
          defaultValue={values.defaultLogoPosition || "bottom-right"}
          disabled={disabled}
          className="h-11 rounded-md border border-border bg-surface px-3 text-base text-foreground"
        >
          {LOGO_POSITIONS.map((position) => (
            <option key={position} value={position}>
              {LOGO_POSITION_LABELS[position]}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="primaryColor" label="Primary brand colour" defaultValue={values.primaryColor} placeholder="#1678FF" disabled={disabled} />
        <Field id="secondaryColor" label="Secondary brand colour" defaultValue={values.secondaryColor} placeholder="#001038" disabled={disabled} />
      </div>
      <Field id="industry" label="Industry" defaultValue={values.industry} disabled={disabled} />
      <Field id="city" label="City" defaultValue={values.city} disabled={disabled} />
      <Field id="description" label="What you offer" defaultValue={values.description} disabled={disabled} />
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-success">{state.message}</p> : null}
      {canEdit ? (
        <Button type="submit" busy={pending}>
          {pending ? "Saving…" : mode === "create" ? "Add brand" : "Save brand"}
        </Button>
      ) : (
        <p className="text-sm text-muted">Only studio owners and admins can edit brands.</p>
      )}
    </form>
  );
}

function Field({
  id,
  label,
  defaultValue,
  type = "text",
  required,
  disabled,
  placeholder,
}: {
  id: string;
  label: string;
  defaultValue: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type={type}
        defaultValue={defaultValue}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
      />
    </div>
  );
}
