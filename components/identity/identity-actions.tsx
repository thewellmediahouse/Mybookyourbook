"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function IdentityActions({
  hasVideo,
  hasPhotos,
  hasAnything,
}: {
  hasVideo: boolean;
  hasPhotos: boolean;
  hasAnything: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function remove(scope: "all" | "photos" | "video") {
    setError(null);
    const confirmMessage =
      scope === "all"
        ? "Remove your Reference Profile files from this studio?"
        : scope === "video"
          ? "Remove the reference video?"
          : "Remove the three identity photos?";
    if (!window.confirm(confirmMessage)) {
      return;
    }
    setPending(true);
    try {
      const response = await fetch(`/api/identity?scope=${scope}`, { method: "DELETE" });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "We couldn't remove that.");
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't remove that.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-10 flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={() => document.getElementById("identity-capture")?.scrollIntoView()}>
          Update profile
        </Button>
        <Button type="button" variant="outline" disabled={!hasVideo || pending} onClick={() => document.getElementById("identity-capture")?.scrollIntoView()}>
          Replace video
        </Button>
        <Button type="button" variant="outline" disabled={!hasPhotos || pending} onClick={() => document.getElementById("identity-capture")?.scrollIntoView()}>
          Replace photos
        </Button>
        <Button type="button" variant="outline" disabled={!hasAnything} busy={pending} onClick={() => remove("all")}>
          Delete Reference Profile
        </Button>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
