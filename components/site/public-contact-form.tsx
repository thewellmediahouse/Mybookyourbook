"use client";

import { useActionState } from "react";
import { sendPublicContactMessage, type ContactActionState } from "@/app/contact/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUPPORT_ABUSE_HINT, SUPPORT_CATEGORIES } from "@/lib/security/copy";

const initial: ContactActionState = {};

export function PublicContactForm() {
  const [state, action, pending] = useActionState(sendPublicContactMessage, initial);

  return (
    <form action={action} className="mt-8 flex max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Your name</Label>
        <Input id="name" name="name" autoComplete="name" disabled={pending} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" disabled={pending} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          name="category"
          defaultValue=""
          required
          disabled={pending}
          className="h-11 rounded-md border border-border bg-surface px-3 text-base text-foreground"
        >
          <option value="" disabled>
            Choose one
          </option>
          {SUPPORT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" name="subject" required disabled={pending} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="message">Message</Label>
        <textarea
          id="message"
          name="message"
          required
          minLength={10}
          disabled={pending}
          rows={6}
          className="rounded-md border border-border bg-surface px-3 py-2 text-base text-foreground"
        />
      </div>
      <p className="text-sm text-muted">{SUPPORT_ABUSE_HINT}</p>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-success">{state.message}</p> : null}
      <Button type="submit" busy={pending}>
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
