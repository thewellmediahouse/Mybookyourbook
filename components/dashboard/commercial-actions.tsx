"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DisabledAction } from "@/components/dashboard/disabled-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VIEWER_CANNOT_CREATE } from "@/lib/dashboard/copy";
import {
  ALREADY_LANDSCAPE,
  ALREADY_VERTICAL,
  ARCHIVE,
  CREATE_ANOTHER_VERSION,
  CREATE_LANDSCAPE,
  CREATE_VARIATION,
  CREATE_VERTICAL,
  DELETE,
  DUPLICATE,
  IN_PRODUCTION_LOCK,
  NEW_ASPECT_RATIO_NOTICE,
  RENAME,
  VARIATION_OPTIONS,
  VERSION_CREDIT_NOTICE,
  isVariationOptionId,
  type VariationOptionId,
} from "@/lib/projects/delivery";
import { isInProductionStatus } from "@/lib/projects/status";
import {
  archiveCommercialAction,
  createFormatVersionAction,
  createVariationAction,
  deleteCommercialAction,
  duplicateCommercialAction,
  renameCommercialAction,
} from "@/app/dashboard/commercials/[id]/actions";

export function CommercialActions({
  projectId,
  title,
  aspectRatio,
  status,
  canManage,
}: {
  projectId: string;
  title: string;
  aspectRatio: string | null;
  status: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState(title);
  const [preset, setPreset] = useState<VariationOptionId>(VARIATION_OPTIONS[0].id);
  const alreadyVertical = aspectRatio === "9:16";
  const alreadyLandscape = aspectRatio === "16:9";
  const archived = status === "ARCHIVED";
  const inProduction = isInProductionStatus(status);

  async function run(action: () => Promise<{ error?: string; redirectTo?: string }>) {
    setPending(true);
    setError(null);
    const result = await action();
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.redirectTo) {
      router.push(result.redirectTo);
      return;
    }
    router.refresh();
  }

  if (!canManage) {
    return <DisabledAction label="More actions" reason={VIEWER_CANNOT_CREATE} />;
  }

  return (
    <div className="mt-10 space-y-8">
      <section className="space-y-4">
        <h2 className="font-display text-2xl text-foreground">{CREATE_ANOTHER_VERSION}</h2>
        <p className="max-w-2xl text-sm text-muted">{VERSION_CREDIT_NOTICE}</p>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => void run(() => duplicateCommercialAction(projectId))}
          >
            {DUPLICATE}
          </Button>
        </div>
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            void run(() => createVariationAction(projectId, preset));
          }}
        >
          <div className="min-w-0 flex-1">
            <Label htmlFor="variation-preset">{CREATE_VARIATION}</Label>
            <select
              id="variation-preset"
              className="mt-2 flex h-11 w-full rounded-md border border-border bg-surface px-3 text-base text-foreground"
              value={preset}
              disabled={pending}
              onChange={(event) => {
                if (isVariationOptionId(event.target.value)) {
                  setPreset(event.target.value);
                }
              }}
            >
              {VARIATION_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="outline" busy={pending}>
            {CREATE_VARIATION}
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        <p className="max-w-2xl text-sm text-muted">{NEW_ASPECT_RATIO_NOTICE}</p>
        <div className="flex flex-wrap gap-3">
          {alreadyVertical ? (
            <DisabledAction label={CREATE_VERTICAL} reason={ALREADY_VERTICAL} />
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => void run(() => createFormatVersionAction(projectId, "9:16"))}
            >
              {CREATE_VERTICAL}
            </Button>
          )}
          {alreadyLandscape ? (
            <DisabledAction label={CREATE_LANDSCAPE} reason={ALREADY_LANDSCAPE} />
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => void run(() => createFormatVersionAction(projectId, "16:9"))}
            >
              {CREATE_LANDSCAPE}
            </Button>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            void run(() => renameCommercialAction(projectId, name));
          }}
        >
          <div className="min-w-0 flex-1">
            <Label htmlFor="commercial-title">{RENAME}</Label>
            <Input
              id="commercial-title"
              className="mt-2"
              value={name}
              disabled={pending}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <Button type="submit" variant="outline" busy={pending}>
            {RENAME}
          </Button>
        </form>
        <div className="flex flex-wrap gap-3">
          {inProduction ? (
            <DisabledAction label={ARCHIVE} reason={IN_PRODUCTION_LOCK} />
          ) : archived ? (
            <DisabledAction label={ARCHIVE} reason="This commercial is already archived." />
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => void run(() => archiveCommercialAction(projectId))}
            >
              {ARCHIVE}
            </Button>
          )}
          {inProduction ? (
            <DisabledAction label={DELETE} reason={IN_PRODUCTION_LOCK} />
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                if (!window.confirm("Delete this commercial? You will not be able to open it again.")) {
                  return;
                }
                void run(() => deleteCommercialAction(projectId));
              }}
            >
              {DELETE}
            </Button>
          )}
        </div>
      </section>
      {error ? <p className="text-sm text-muted">{error}</p> : null}
    </div>
  );
}
