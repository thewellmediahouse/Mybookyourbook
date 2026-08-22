"use client";

import { useActionState } from "react";
import {
  deductCreditAction,
  grantCreditAction,
  resetPasswordAction,
  suspendUserAction,
  type AdminActionState,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AdminActionState = {};

export function UserAdminActions({
  userId,
  email,
  memberships,
}: {
  userId: string;
  email: string;
  memberships: { workspaceId: string; workspaceName: string }[];
}) {
  const [suspendState, suspend, suspending] = useActionState(suspendUserAction, initial);
  const [resetState, reset, resetting] = useActionState(resetPasswordAction, initial);
  const [grantState, grant, granting] = useActionState(grantCreditAction, initial);
  const [deductState, deduct, deducting] = useActionState(deductCreditAction, initial);

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <form action={suspend} className="rounded-lg border border-border bg-surface p-5">
        <input type="hidden" name="userId" value={userId} />
        <Label htmlFor="status">Account status</Label>
        <select
          id="status"
          name="status"
          className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-foreground"
        >
          <option value="suspended">Suspend</option>
          <option value="active">Unsuspend</option>
        </select>
        <Button className="mt-4" type="submit" busy={suspending}>
          Save status
        </Button>
        {suspendState.error ? <p className="mt-2 text-sm text-danger">{suspendState.error}</p> : null}
        {suspendState.message ? <p className="mt-2 text-sm text-success">{suspendState.message}</p> : null}
      </form>
      <form action={reset} className="rounded-lg border border-border bg-surface p-5">
        <input type="hidden" name="email" value={email} />
        <p className="text-sm text-muted">Send a password reset email. Staff cannot view passwords.</p>
        <Button className="mt-4" type="submit" variant="outline" busy={resetting}>
          Send reset link
        </Button>
        {resetState.error ? <p className="mt-2 text-sm text-danger">{resetState.error}</p> : null}
        {resetState.message ? <p className="mt-2 text-sm text-success">{resetState.message}</p> : null}
      </form>
      <form action={grant} className="rounded-lg border border-border bg-surface p-5">
        <Label htmlFor="workspaceId">Grant credits</Label>
        <select
          id="workspaceId"
          name="workspaceId"
          className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-foreground"
        >
          {memberships.map((row) => (
            <option key={row.workspaceId} value={row.workspaceId}>
              {row.workspaceName}
            </option>
          ))}
        </select>
        <Input className="mt-2" name="amount" type="number" min={1} defaultValue={1} required />
        <Input className="mt-2" name="reason" placeholder="Reason" required />
        <Button className="mt-4" type="submit" busy={granting}>
          Grant
        </Button>
        {grantState.error ? <p className="mt-2 text-sm text-danger">{grantState.error}</p> : null}
        {grantState.message ? <p className="mt-2 text-sm text-success">{grantState.message}</p> : null}
      </form>
      <form action={deduct} className="rounded-lg border border-border bg-surface p-5">
        <Label htmlFor="deductWorkspace">Deduct credits</Label>
        <select
          id="deductWorkspace"
          name="workspaceId"
          className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-foreground"
        >
          {memberships.map((row) => (
            <option key={row.workspaceId} value={row.workspaceId}>
              {row.workspaceName}
            </option>
          ))}
        </select>
        <Input className="mt-2" name="amount" type="number" min={1} defaultValue={1} required />
        <Input className="mt-2" name="reason" placeholder="Reason" required />
        <Button className="mt-4" type="submit" variant="outline" busy={deducting}>
          Deduct
        </Button>
        {deductState.error ? <p className="mt-2 text-sm text-danger">{deductState.error}</p> : null}
        {deductState.message ? <p className="mt-2 text-sm text-success">{deductState.message}</p> : null}
      </form>
    </div>
  );
}
