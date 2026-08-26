"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/auth-client";
import { normalizeEmail } from "@/lib/auth/password";

export function LoginForm({
  googleEnabled,
  next,
}: {
  googleEnabled: boolean;
  next?: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const afterSignIn = next || "/dashboard";
  const signupHref = next ? `/signup?next=${encodeURIComponent(next)}` : "/signup";

  async function onSubmit(formData: FormData) {
    setError(null);
    const email = normalizeEmail(String(formData.get("email") ?? ""));
    const password = String(formData.get("password") ?? "");
    setPending(true);
    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
      callbackURL: afterSignIn,
    });
    setPending(false);
    if (signInError) {
      if (signInError.status === 403) {
        const params = new URLSearchParams();
        if (next) {
          params.set("next", next);
        }
        if (email) {
          params.set("email", email);
        }
        router.push(`/verify-email?${params.toString()}`);
        return;
      }
      setError("That email or password didn't match. Try again or reset your password.");
      return;
    }
    router.push(afterSignIn);
    router.refresh();
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" busy={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      {googleEnabled ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => authClient.signIn.social({ provider: "google", callbackURL: afterSignIn })}
        >
          Continue with Google
        </Button>
      ) : null}
      <p className="text-sm text-muted">
        <Link href="/forgot-password" className="text-foreground underline">
          Forgot password?
        </Link>
      </p>
      <p className="text-sm text-muted">
        New to Production30?{" "}
        <Link href={signupHref} className="text-foreground underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
