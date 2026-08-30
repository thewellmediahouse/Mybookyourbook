"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, type ProfileActionState } from "./actions";

const initial: ProfileActionState = {};

export function ProfileForm({
  email,
  firstName,
  lastName,
  timezone,
  country,
}: {
  email: string;
  firstName: string;
  lastName: string;
  timezone: string;
  country: string;
}) {
  const [state, action, pending] = useActionState(updateProfile, initial);

  return (
    <form action={action} className="mt-10 flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="firstName">First name</Label>
        <Input id="firstName" name="firstName" defaultValue={firstName} required autoComplete="given-name" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="lastName">Last name</Label>
        <Input id="lastName" name="lastName" defaultValue={lastName} required autoComplete="family-name" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={email} disabled />
        <p className="text-sm text-muted">
          Email changes need a verification step. That is not available on this screen yet.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Input
          id="timezone"
          name="timezone"
          defaultValue={timezone}
          placeholder="Africa/Johannesburg"
          autoComplete="off"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="country">Country</Label>
        <Input id="country" name="country" defaultValue={country} autoComplete="country-name" />
      </div>
      <p className="text-sm text-muted">
        Profile photo upload is not available yet. No image is stored from this screen.
      </p>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-success">{state.message}</p> : null}
      <Button type="submit" busy={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
