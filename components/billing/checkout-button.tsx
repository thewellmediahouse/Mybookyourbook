"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CheckoutButton({
  planId,
  label,
  endpoint = "/api/billing/checkout",
}: {
  planId: string;
  label: string;
  endpoint?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onClick() {
    setError(null);
    setPending(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = (await response.json()) as { authorizationUrl?: string; error?: string };
      if (!response.ok || !data.authorizationUrl) {
        setError(data.error ?? "We couldn't start checkout. Try again.");
        return;
      }
      window.location.href = data.authorizationUrl;
    } catch {
      setError("We couldn't start checkout. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <Button type="button" onClick={onClick} busy={pending}>
        {pending ? "Opening checkout…" : label}
      </Button>
      {error ? <p className="mt-2 max-w-md text-sm text-danger">{error}</p> : null}
    </div>
  );
}
