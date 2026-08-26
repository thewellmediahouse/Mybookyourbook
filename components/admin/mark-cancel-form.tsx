"use client";

import { useActionState } from "react";
import { markCancelAtPeriodEndAction, type AdminActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

const initial: AdminActionState = {};

export function MarkCancelForm({ subscriptionId }: { subscriptionId: string }) {
  const [state, action, pending] = useActionState(markCancelAtPeriodEndAction, initial);
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="subscriptionId" value={subscriptionId} />
      <Button type="submit" variant="outline" busy={pending}>
        {pending ? "Saving…" : "Mark cancel at period end"}
      </Button>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-success">{state.message}</p> : null}
    </form>
  );
}
