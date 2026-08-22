"use client";

import { useActionState } from "react";
import { updatePlanAction, type AdminActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AdminActionState = {};

export function PlanEditForm(props: {
  planId: string;
  name: string;
  region: string;
  amountMinor: number | null;
  currency: string;
  credits: number | null;
  interval: "one_time" | "month";
  active: boolean;
  introductoryOffer: boolean;
}) {
  const [state, action, pending] = useActionState(updatePlanAction, initial);
  return (
    <form action={action} className="rounded-lg border border-border bg-surface p-5">
      <input type="hidden" name="planId" value={props.planId} />
      <h2 className="font-display text-xl text-foreground">
        {props.name} · {props.region}
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`amount-${props.planId}`}>Amount (minor units)</Label>
          <Input id={`amount-${props.planId}`} name="amountMinor" defaultValue={props.amountMinor ?? ""} />
        </div>
        <div>
          <Label htmlFor={`currency-${props.planId}`}>Currency</Label>
          <Input id={`currency-${props.planId}`} name="currency" defaultValue={props.currency} required />
        </div>
        <div>
          <Label htmlFor={`credits-${props.planId}`}>Credits</Label>
          <Input id={`credits-${props.planId}`} name="credits" defaultValue={props.credits ?? ""} />
        </div>
        <div>
          <Label htmlFor={`interval-${props.planId}`}>Interval</Label>
          <select
            id={`interval-${props.planId}`}
            name="interval"
            defaultValue={props.interval}
            className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 text-foreground"
          >
            <option value="one_time">One time</option>
            <option value="month">Month</option>
          </select>
        </div>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" name="active" defaultChecked={props.active} className="accent-accent" />
        Active
      </label>
      <label className="mt-2 flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" name="introductoryOffer" defaultChecked={props.introductoryOffer} className="accent-accent" />
        Introductory offer
      </label>
      <Button className="mt-4" type="submit" busy={pending}>
        Save plan
      </Button>
      {state.error ? <p className="mt-2 text-sm text-danger">{state.error}</p> : null}
      {state.message ? <p className="mt-2 text-sm text-success">{state.message}</p> : null}
    </form>
  );
}
