"use client";

import { useActionState } from "react";
import { inviteTeammateAction, type TeamActionState } from "@/app/dashboard/team/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INVITABLE_ROLES } from "@/lib/authz/roles";
import { INVITE_BUTTON, INVITE_EXPIRES, roleLabel } from "@/lib/workspaces/copy";

const initial: TeamActionState = {};

export function InviteForm() {
  const [state, action, pending] = useActionState(inviteTeammateAction, initial);

  return (
    <form action={action} className="mt-6 flex max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required disabled={pending} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          defaultValue="CREATOR"
          disabled={pending}
          className="h-11 rounded-md border border-border bg-surface px-3 text-base text-foreground"
        >
          {INVITABLE_ROLES.map((role) => (
            <option key={role} value={role}>
              {roleLabel(role)}
            </option>
          ))}
        </select>
      </div>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-success">{state.message}</p> : null}
      <p className="text-sm text-muted">{INVITE_EXPIRES}</p>
      <Button type="submit" busy={pending}>
        {pending ? "Sending…" : INVITE_BUTTON}
      </Button>
    </form>
  );
}
