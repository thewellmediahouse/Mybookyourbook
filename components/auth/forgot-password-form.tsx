"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/auth-client";
import { normalizeEmail } from "@/lib/auth/password";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    const email = normalizeEmail(String(formData.get("email") ?? ""));
    setPending(true);
    await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPending(false);
    setMessage(
      "If that email is registered, we sent a reset link. In local development, check the server log.",
    );
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      <Button type="submit" busy={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
