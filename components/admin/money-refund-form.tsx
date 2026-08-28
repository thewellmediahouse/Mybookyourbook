"use client";

import { useActionState } from "react";
import { recordMoneyRefundAction, type AdminActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: AdminActionState = {};

export function RecordMoneyRefundForm({ paymentId }: { paymentId: string }) {
  const [state, action, pending] = useActionState(recordMoneyRefundAction, initial);
  return (
    <form action={action} className="flex max-w-xl flex-col gap-2">
      <input type="hidden" name="paymentId" value={paymentId} />
      <Input
        name="note"
        required
        minLength={8}
        disabled={pending}
        placeholder="Returned in Rapyd Client Portal"
      />
      <Button type="submit" variant="outline" busy={pending}>
        {pending ? "Saving…" : "Record money returned"}
      </Button>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-success">{state.message}</p> : null}
    </form>
  );
}
