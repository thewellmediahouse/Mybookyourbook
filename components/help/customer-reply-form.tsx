"use client";

import { useActionState } from "react";
import { replyToSupportMessage, type SupportActionState } from "@/app/dashboard/help/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SUPPORT_REPLY_HINT } from "@/lib/security/copy";

const initial: SupportActionState = {};

export function CustomerReplyForm({ ticketId }: { ticketId: string }) {
  const [state, action, pending] = useActionState(replyToSupportMessage, initial);
  return (
    <form action={action} className="mt-4 flex flex-col gap-3">
      <input type="hidden" name="ticketId" value={ticketId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor={`reply-${ticketId}`}>Add to this message</Label>
        <textarea
          id={`reply-${ticketId}`}
          name="body"
          required
          minLength={10}
          disabled={pending}
          rows={4}
          className="rounded-md border border-border bg-surface px-3 py-2 text-base text-foreground"
        />
      </div>
      <p className="text-sm text-muted">{SUPPORT_REPLY_HINT}</p>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-success">{state.message}</p> : null}
      <Button type="submit" variant="outline" busy={pending}>
        {pending ? "Sending…" : "Send another message"}
      </Button>
    </form>
  );
}
