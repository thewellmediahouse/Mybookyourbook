"use client";

import { useActionState } from "react";
import { runCleanupAction, type AdminActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

const initial: AdminActionState = {};

export function CleanupButton() {
  const [state, action, pending] = useActionState(runCleanupAction, initial);
  return (
    <form action={action} className="mt-8">
      <Button type="submit" variant="outline" busy={pending}>
        {pending ? "Queuing…" : "Run Cleanup"}
      </Button>
      {state.error ? <p className="mt-2 text-sm text-danger">{state.error}</p> : null}
      {state.message ? <p className="mt-2 text-sm text-success">{state.message}</p> : null}
    </form>
  );
}
