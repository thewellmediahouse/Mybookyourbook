"use client";

import { useActionState } from "react";
import { setTicketAction, type AdminActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

const initial: AdminActionState = {};

export function TicketStatusForm({ ticketId, status }: { ticketId: string; status: string }) {
  const [state, action, pending] = useActionState(setTicketAction, initial);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="ticketId" value={ticketId} />
      <select
        name="status"
        defaultValue={status}
        className="h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
      >
        <option value="OPEN">OPEN</option>
        <option value="IN_PROGRESS">IN_PROGRESS</option>
        <option value="RESOLVED">RESOLVED</option>
        <option value="CLOSED">CLOSED</option>
      </select>
      <Button type="submit" variant="outline" busy={pending}>
        Save
      </Button>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
    </form>
  );
}
