"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CancelSubscriptionButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onClick() {
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/billing/cancel", { method: "POST" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "We couldn't cancel that plan.");
        return;
      }
      router.refresh();
    } catch {
      setError("We couldn't cancel that plan.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <Button type="button" variant="outline" onClick={onClick} busy={pending}>
        {pending ? "Cancelling…" : "Cancel subscription"}
      </Button>
      {error ? <p className="mt-2 max-w-md text-sm text-danger">{error}</p> : null}
    </div>
  );
}
