"use client";

import { useActionState } from "react";
import { savePromptAction, type AdminActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AdminActionState = {};

export function PromptForm() {
  const [state, action, pending] = useActionState(savePromptAction, initial);
  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="key">Key</Label>
        <Input id="key" name="key" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="body">Body</Label>
        <textarea
          id="body"
          name="body"
          required
          className="min-h-40 rounded-md border border-border bg-surface px-3 py-2 text-foreground"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" name="activate" className="accent-accent" />
        Make active
      </label>
      <Button type="submit" busy={pending}>
        Save framework
      </Button>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-success">{state.message}</p> : null}
    </form>
  );
}
