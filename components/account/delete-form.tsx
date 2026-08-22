"use client";

import { useActionState } from "react";
import { deleteAccountAction, type AccountActionState } from "@/app/dashboard/settings/account/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DELETE_CONFIRMATION, DELETE_CONFIRM_HINT } from "@/lib/security/copy";

const initial: AccountActionState = {};

export function DeleteAccountForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action, pending] = useActionState(deleteAccountAction, initial);

  return (
    <form action={action} className="mt-4 flex max-w-md flex-col gap-4">
      {hasPassword ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Current password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={pending}
          />
        </div>
      ) : null}
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmation">{DELETE_CONFIRM_HINT}</Label>
        <Input
          id="confirmation"
          name="confirmation"
          autoComplete="off"
          required
          disabled={pending}
          placeholder={DELETE_CONFIRMATION}
        />
      </div>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <Button type="submit" variant="outline" busy={pending}>
        {pending ? "Closing account…" : "Delete account"}
      </Button>
    </form>
  );
}
