"use client";

import { useActionState } from "react";
import { sendPublicContactMessage, type ContactActionState } from "@/app/contact/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUPPORT_ABUSE_HINT, SUPPORT_CATEGORIES } from "@/lib/security/copy";

const initial: ContactActionState = {};

const fieldClass =
  "h-11 rounded-xl border border-[#111A31]/12 bg-[#F7F8FC] px-3 text-base text-[#111A31] placeholder:text-[#5A6480]";

export function PublicContactForm() {
  const [state, action, pending] = useActionState(sendPublicContactMessage, initial);

  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name" className="text-[#111A31]">
          Your name
        </Label>
        <Input id="name" name="name" autoComplete="name" disabled={pending} className={fieldClass} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-[#111A31]">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          disabled={pending}
          className={fieldClass}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="category" className="text-[#111A31]">
          Category
        </Label>
        <select
          id="category"
          name="category"
          defaultValue=""
          required
          disabled={pending}
          className={fieldClass}
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
        <Label htmlFor="subject" className="text-[#111A31]">
          Subject
        </Label>
        <Input id="subject" name="subject" required disabled={pending} className={fieldClass} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="message" className="text-[#111A31]">
          Message
        </Label>
        <textarea
          id="message"
          name="message"
          required
          minLength={10}
          disabled={pending}
          rows={6}
          className="rounded-xl border border-[#111A31]/12 bg-[#F7F8FC] px-3 py-2 text-base text-[#111A31]"
        />
      </div>
      <p className="text-sm text-[#5A6480]">{SUPPORT_ABUSE_HINT}</p>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-success">{state.message}</p> : null}
      <Button type="submit" busy={pending} className="rounded-full">
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
