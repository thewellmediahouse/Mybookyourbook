"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CONSENT_ADULT,
  CONSENT_IMPERSONATION,
  CONSENT_LIKENESS,
  CONSENT_PROCESSING,
} from "@/lib/identity/copy";

export function IdentityConsentForm() {
  const router = useRouter();
  const [likeness, setLikeness] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [impersonation, setImpersonation] = useState(false);
  const [adult, setAdult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const ready = likeness && processing && impersonation && adult;

  async function onSubmit() {
    setError(null);
    if (!ready) {
      setError("All consent boxes must be checked before we can save identity files.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/identity/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ likeness, processing, impersonation, adult }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "We couldn't save that consent.");
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't save that consent.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-10 rounded-lg border border-border bg-surface p-6">
      <p className="text-muted">
        Before we save private references, confirm each point below. The presenter must be an adult.
      </p>
      <ul className="mt-6 flex flex-col gap-4">
        <ConsentBox checked={likeness} onChange={setLikeness} label={CONSENT_LIKENESS} />
        <ConsentBox checked={processing} onChange={setProcessing} label={CONSENT_PROCESSING} />
        <ConsentBox checked={impersonation} onChange={setImpersonation} label={CONSENT_IMPERSONATION} />
        <ConsentBox checked={adult} onChange={setAdult} label={CONSENT_ADULT} />
      </ul>
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
      <Button type="button" className="mt-6" disabled={!ready} busy={pending} onClick={() => void onSubmit()}>
        {pending ? "Saving…" : "Save consent"}
      </Button>
    </div>
  );
}

function ConsentBox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <li>
      <label className="flex items-start gap-3 text-sm text-muted">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-1 size-4 accent-accent"
        />
        <span>{label}</span>
      </label>
    </li>
  );
}
