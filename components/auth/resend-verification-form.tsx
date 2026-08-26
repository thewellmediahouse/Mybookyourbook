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
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const callbackURL = next || "/onboarding";

  async function onSubmit(formData: FormData) {
    const address = normalizeEmail(String(formData.get("email") ?? ""));
    setPending(true);
    await authClient.sendVerificationEmail({
      email: address,
      callbackURL,
    });
    setPending(false);
    setMessage("If that account needs verifying, we sent a new link. Check your email, or the server log in development.");
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
          defaultValue={email ?? ""}
          required
        />
      </div>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      <Button type="submit" variant="outline" busy={pending}>
        {pending ? "Sending…" : "Resend verification email"}
      </Button>
    </form>
  );
}
