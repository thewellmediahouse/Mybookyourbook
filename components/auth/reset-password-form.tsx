"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/auth-client";
import { isStrongPassword, passwordHint } from "@/lib/auth/password";

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!token) {
    return (
      <p className="text-sm text-danger">
        This reset link is missing or expired. Request a new one from the forgot password page.
      </p>
    );
  }

  async function onSubmit(formData: FormData) {
    const password = String(formData.get("password") ?? "");
    if (!isStrongPassword(password)) {
      setError(passwordHint());
      return;
    }
    setPending(true);
    const { error: resetError } = await authClient.resetPassword({
      newPassword: password,
      token: token!,
    });
    setPending(false);
    if (resetError) {
      setError("We couldn't reset that password. Request a new link and try again.");
      return;
    }
    router.push("/login");
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
        />
        <p className="text-sm text-muted">{passwordHint()}</p>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" busy={pending}>
        {pending ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}
