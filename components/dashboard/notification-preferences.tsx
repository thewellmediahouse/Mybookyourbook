"use client";

import { useActionState } from "react";
import { updateNotificationPreferences } from "@/app/dashboard/settings/notifications/actions";
import { Button } from "@/components/ui/button";

const LOCKED = [
  { label: "Production complete email", state: "On", note: "Transactional. Stays on." },
  { label: "Production failure email", state: "On", note: "Transactional. Stays on." },
  { label: "Billing email", state: "On", note: "Transactional. Stays on." },
  { label: "Marketing email", state: "Off", note: "Off unless you consent later." },
] as const;

export function NotificationPreferencesForm({ productUpdates }: { productUpdates: boolean }) {
  const [state, action, pending] = useActionState(updateNotificationPreferences, {} as { error?: string; message?: string });

  return (
    <form action={action} className="mt-10 space-y-6">
      <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
        {LOCKED.map((item) => (
          <li key={item.label} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:justify-between">
            <div>
              <p className="text-foreground">{item.label}</p>
              <p className="text-sm text-muted">{item.note}</p>
            </div>
            <p className="text-sm text-muted">{item.state}</p>
          </li>
        ))}
        <li className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-foreground">Product updates</p>
            <p className="text-sm text-muted">Occasional product news. Off until you turn it on.</p>
          </div>
          <label className="inline-flex min-h-11 items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name="productUpdates"
              defaultChecked={productUpdates}
              className="size-4 accent-accent"
            />
            On
          </label>
        </li>
      </ul>
      <Button type="submit" busy={pending}>
        {pending ? "Saving…" : "Save preferences"}
      </Button>
      {state.message ? <p className="text-sm text-muted">{state.message}</p> : null}
      {state.error ? <p className="text-sm text-muted">{state.error}</p> : null}
    </form>
  );
}
