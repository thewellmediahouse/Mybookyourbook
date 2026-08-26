"use client";

import { useActionState, useState } from "react";
import { completeOnboarding, previewWebsiteImport, type OnboardingState } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const steps = [
  { key: "account", title: "Account", body: "Confirm the name on your studio." },
  { key: "business", title: "Business", body: "Tell us who you are producing for." },
  { key: "brand", title: "Brand", body: "Optional details we can apply later when we add your brand." },
  { key: "identity", title: "Show who you are", body: "You can do this later. Production waits until it's done." },
  { key: "ready", title: "Ready", body: "Your studio opens after this step." },
];

export function OnboardingForm({
  firstName,
  lastName,
  email,
}: {
  firstName: string;
  lastName: string;
  email: string;
}) {
  const [step, setStep] = useState(0);
  const [importWarning, setImportWarning] = useState<string | null>(null);
  const [state, action, pending] = useActionState(completeOnboarding, null as OnboardingState);

  async function onImport(formData: FormData) {
    setImportWarning(null);
    const preview = await previewWebsiteImport(formData);
    if (preview.error) {
      setImportWarning(preview.error);
      return;
    }
    setImportWarning(preview.result?.warnings[0] ?? null);
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <ol className="flex flex-wrap gap-2 text-xs tracking-[0.18em] text-muted">
        {steps.map((item, index) => (
          <li
            key={item.key}
            className={index === step ? "text-accent-ink" : undefined}
          >
            {String(index + 1).padStart(2, "0")} {item.title}
          </li>
        ))}
      </ol>
      <div>
        <h2 className="font-display text-2xl text-foreground">{steps[step].title}</h2>
        <p className="mt-2 text-muted">{steps[step].body}</p>
      </div>

      <div className={step === 0 ? "flex flex-col gap-4" : "hidden"}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" name="firstName" defaultValue={firstName} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" name="lastName" defaultValue={lastName} required />
        </div>
        <p className="text-sm text-muted">Signed in as {email}.</p>
      </div>

      <div className={step === 1 ? "flex flex-col gap-4" : "hidden"}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="studioName">Business or studio name</Label>
          <Input id="studioName" name="studioName" required />
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-foreground">What are you setting up?</legend>
          <label className="flex items-start gap-3 text-sm text-muted">
            <input type="radio" name="type" value="BUSINESS" defaultChecked className="mt-1 accent-accent" />
            One business
          </label>
          <label className="flex items-start gap-3 text-sm text-muted">
            <input type="radio" name="type" value="AGENCY" className="mt-1 accent-accent" />
            An agency looking after more than one client brand
          </label>
        </fieldset>
        <div className="flex flex-col gap-2">
          <Label htmlFor="country">Country you bill from</Label>
          <select
            id="country"
            name="country"
            defaultValue="ZA"
            className="h-11 rounded-md border border-border bg-surface px-3 text-base text-foreground"
          >
            <option value="ZA">South Africa (prices in rand)</option>
            <option value="INT">Outside South Africa (international prices)</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="website">Website (optional)</Label>
          <Input id="website" name="website" type="url" placeholder="https://" />
        </div>
        <Button type="submit" formAction={onImport} variant="outline">
          Import From Website
        </Button>
        {importWarning ? <p className="text-sm text-muted">{importWarning}</p> : null}
      </div>

      <div className={step === 2 ? "flex flex-col gap-4" : "hidden"}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="tagline">Tagline (optional)</Label>
          <Input id="tagline" name="tagline" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="industry">Industry (optional)</Label>
          <Input id="industry" name="industry" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="city">City (optional)</Label>
          <Input id="city" name="city" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">What you offer (optional)</Label>
          <Input id="description" name="description" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="primaryColor">Primary brand colour (optional)</Label>
            <Input id="primaryColor" name="primaryColor" placeholder="#1678FF" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="secondaryColor">Secondary brand colour (optional)</Label>
            <Input id="secondaryColor" name="secondaryColor" placeholder="#001038" />
          </div>
        </div>
        <p className="text-sm text-muted">
          Upload the logo after your studio opens. PNG, JPEG, WebP, or SVG. We keep the original file.
        </p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" name="phone" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Business email (optional)</Label>
          <Input id="email" name="email" type="email" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="whatsapp">WhatsApp (optional)</Label>
          <Input id="whatsapp" name="whatsapp" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="defaultCta">Preferred call to action (optional)</Label>
          <Input id="defaultCta" name="defaultCta" placeholder="Visit our website" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="defaultLogoPosition">Default logo position</Label>
          <select
            id="defaultLogoPosition"
            name="defaultLogoPosition"
            defaultValue="bottom-right"
            className="h-11 rounded-md border border-border bg-surface px-3 text-base text-foreground"
          >
            <option value="bottom-right">Bottom right</option>
            <option value="bottom-left">Bottom left</option>
            <option value="top-right">Top right</option>
            <option value="top-left">Top left</option>
          </select>
        </div>
      </div>

      <div className={step === 3 ? "flex flex-col gap-4" : "hidden"}>
        <p className="text-muted">
          Later you will record a short reference and three guided photos. That step is required
          before we can produce a commercial starring you. You may skip it for now.
        </p>
        <label className="flex items-start gap-3 text-sm text-muted">
          <input id="skipIdentity" name="skipIdentity" type="checkbox" className="mt-1 size-4 accent-accent" />
          <span>
            Skip for now. I understand I cannot produce a commercial until I have shown who I am.
          </span>
        </label>
      </div>

      <div className={step === 4 ? "flex flex-col gap-4" : "hidden"}>
        <p className="text-muted">
          We will create your studio, add you as the owner, and open an empty credits wallet. No
          commercial is produced in this step.
        </p>
      </div>

      {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        {step > 0 ? (
          <Button type="button" variant="outline" onClick={() => setStep((value) => value - 1)}>
            Back
          </Button>
        ) : null}
        {step < steps.length - 1 ? (
          <Button type="button" onClick={() => setStep((value) => value + 1)}>
            Continue
          </Button>
        ) : (
          <Button type="submit" busy={pending}>
            {pending ? "Opening studio…" : "Open my studio"}
          </Button>
        )}
      </div>
    </form>
  );
}
