"use client";

import { useActionState } from "react";
import { replyToTicketAction, type AdminActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const initial: AdminActionState = {};

export function TicketReplyForm({ ticketId }: { ticketId: string }) {
  const [state, action, pending] = useActionState(replyToTicketAction, initial);
  return (
    <form action={action} className="mt-4 flex max-w-2xl flex-col gap-3">
      <input type="hidden" name="ticketId" value={ticketId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="reply">Reply to the customer</Label>
        <textarea
          id="reply"
          name="body"
          required
          minLength={10}
          disabled={pending}
          rows={6}
          className="rounded-md border border-border bg-surface px-3 py-2 text-base text-foreground"
        />
      </div>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-success">{state.message}</p> : null}
      <Button type="submit" busy={pending}>
        {pending ? "Sending…" : "Send reply"}
      </Button>
    </form>
  );
}
