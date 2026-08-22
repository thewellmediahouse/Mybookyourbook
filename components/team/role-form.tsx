"use client";

import { useActionState } from "react";
import { changeMemberRoleAction, type TeamActionState } from "@/app/dashboard/team/actions";
import { Button } from "@/components/ui/button";
import { INVITABLE_ROLES, type WorkspaceRole } from "@/lib/authz/roles";
import { roleLabel } from "@/lib/workspaces/copy";

const initial: TeamActionState = {};

export function RoleForm({
  memberId,
  role,
}: {
  memberId: string;
  role: WorkspaceRole;
}) {
  const [state, action, pending] = useActionState(changeMemberRoleAction, initial);

  return (
    <form action={action} className="flex flex-col items-start gap-2 sm:items-end">
      <input type="hidden" name="memberId" value={memberId} />
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`role-${memberId}`} className="sr-only">
          Role
        </label>
        <select
          id={`role-${memberId}`}
          name="role"
          defaultValue={role}
          disabled={pending}
          className="h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
        >
          {INVITABLE_ROLES.map((option) => (
            <option key={option} value={option}>
              {roleLabel(option)}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" busy={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-success">{state.message}</p> : null}
    </form>
  );
}
