"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/auth-client";
import { isStrongPassword, normalizeEmail, passwordHint } from "@/lib/auth/password";

export function SignupForm({
  googleEnabled,
  next,
}: {
  googleEnabled: boolean;
  next?: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const afterSignUp = next || "/onboarding";
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
  const verifyHref = next ? `/verify-email?next=${encodeURIComponent(next)}` : "/verify-email";

  async function onSubmit(formData: FormData) {
    setError(null);
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const email = normalizeEmail(String(formData.get("email") ?? ""));
    const password = String(formData.get("password") ?? "");
    const terms = formData.get("terms") === "on";
    const privacy = formData.get("privacy") === "on";

    if (!firstName || !lastName) {
      setError("Enter your first and last name.");
      return;
    }
    if (!email) {
      setError("Enter a valid email address.");
      return;
    }
    if (!isStrongPassword(password)) {
      setError(passwordHint());
      return;
    }
    if (!terms || !privacy) {
      setError("Please accept the terms and privacy policy to create an account.");
      return;
    }

    setPending(true);
    const { error: signUpError } = await authClient.signUp.email({
      name: `${firstName} ${lastName}`,
      email,
      password,
      firstName,
      lastName,
      callbackURL: afterSignUp,
    });
    setPending(false);

    if (signUpError) {
      setError("We couldn't create your account. Try again or sign in if you already have one.");
      return;
    }

    router.push(verifyHref);
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" name="firstName" autoComplete="given-name" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" name="lastName" autoComplete="family-name" required />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
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
      <label className="flex items-start gap-3 text-sm text-muted">
        <input id="terms" name="terms" type="checkbox" className="mt-1 size-4 accent-accent" required />
        <span>
          I agree to the{" "}
          <Link href="/terms" className="text-foreground underline">
            Terms
          </Link>
          , including{" "}
          <Link href="/acceptable-use" className="text-foreground underline">
            Acceptable use
          </Link>
          .
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm text-muted">
        <input
          id="privacy"
          name="privacy"
          type="checkbox"
          className="mt-1 size-4 accent-accent"
          required
        />
        <span>
          I agree to the{" "}
          <Link href="/privacy" className="text-foreground underline">
            Privacy Policy
          </Link>
          .
        </span>
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" busy={pending} className="rounded-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
      {googleEnabled ? (
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={() => authClient.signIn.social({ provider: "google", callbackURL: afterSignUp })}
        >
          Continue with Google
        </Button>
      ) : null}
      <p className="text-sm text-muted">
        Already have an account?{" "}
        <Link href={loginHref} className="text-foreground underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
