"use client";

import { useActionState } from "react";
import { deductCreditAction, grantCreditAction, type AdminActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AdminActionState = {};

export function CreditAdjustForm() {
  const [grantState, grant, granting] = useActionState(grantCreditAction, initial);
  const [deductState, deduct, deducting] = useActionState(deductCreditAction, initial);
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <form action={grant} className="rounded-lg border border-border bg-surface p-5">
        <Label htmlFor="grantWorkspace">Grant to workspace ID</Label>
        <Input className="mt-2" id="grantWorkspace" name="workspaceId" required />
        <Input className="mt-2" name="amount" type="number" min={1} defaultValue={1} required />
        <Input className="mt-2" name="reason" placeholder="Reason" required />
        <Button className="mt-4" type="submit" busy={granting}>
          Grant
        </Button>
        {grantState.error ? <p className="mt-2 text-sm text-danger">{grantState.error}</p> : null}
        {grantState.message ? <p className="mt-2 text-sm text-success">{grantState.message}</p> : null}
      </form>
      <form action={deduct} className="rounded-lg border border-border bg-surface p-5">
        <Label htmlFor="deductWorkspace">Deduct from workspace ID</Label>
        <Input className="mt-2" id="deductWorkspace" name="workspaceId" required />
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
