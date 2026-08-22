"use client";

import { useActionState } from "react";
import { acceptInviteAction, type AcceptInviteState } from "@/app/invite/accept/actions";
import { Button } from "@/components/ui/button";
import { JOIN_STUDIO } from "@/lib/workspaces/copy";

const initial: AcceptInviteState = {};

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acceptInviteAction, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <Button type="submit" busy={pending}>
        {pending ? "Joining…" : JOIN_STUDIO}
      </Button>
    </form>
  );
}
