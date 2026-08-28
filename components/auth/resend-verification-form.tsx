"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/auth-client";
import { normalizeEmail } from "@/lib/auth/password";

export function ResendVerificationForm({
  next,
  email,
}: {
  next?: string | null;
  email?: string | null;
}) {
  const knownEmail = email ? normalizeEmail(email) : "";
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const callbackURL = next || "/onboarding";

  async function sendTo(address: string) {
    setPending(true);
    await authClient.sendVerificationEmail({
      email: address,
      callbackURL,
    });
    setPending(false);
    setMessage("If that account still needs confirming, we sent another message. Check your inbox.");
  }

  async function onSubmit(formData: FormData) {
    const address = normalizeEmail(String(formData.get("email") ?? knownEmail));
    await sendTo(address);
  }

  if (knownEmail) {
    return (
      <div className="mt-8 flex flex-col gap-4">
        {message ? <p className="text-sm text-muted">{message}</p> : null}
        <Button
          type="button"
          variant="outline"
          busy={pending}
          className="rounded-full"
          onClick={() => void sendTo(knownEmail)}
        >
          {pending ? "Sending…" : "Send the message again"}
        </Button>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="mt-8 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      <Button type="submit" variant="outline" busy={pending} className="rounded-full">
        {pending ? "Sending…" : "Send the message again"}
      </Button>
    </form>
  );
}
