"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { previewWebsiteForAdvert, startStudioAction } from "@/app/dashboard/create/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ASPECT_RATIOS } from "@/lib/projects/brief";
import {
  STUDIO_BUSINESS_BODY,
  STUDIO_BUSINESS_HEADING,
  STUDIO_CONTINUE_DRAFT,
  STUDIO_PRESET_HEADING,
  STUDIO_VIRAL_BODY,
  STUDIO_VIRAL_HEADING,
  STUDIO_VIRAL_HINT,
  STUDIO_WEBSITE_HINT,
} from "@/lib/projects/copy";
import {
  BUSINESS_METHODS,
  VIRAL_METHODS,
  presetsForLane,
  type StudioLane,
  type StudioStartInput,
} from "@/lib/studio/presets";
import { cn } from "@/lib/utils";

type Panel = "none" | "website" | "reference";

export function AdStudio({
  brands,
  defaultBrandId,
  draftProjectId,
}: {
  brands: { id: string; name: string }[];
  defaultBrandId: string;
  draftProjectId: string | null;
}) {
  const router = useRouter();
  const [brandId, setBrandId] = useState(defaultBrandId);
  const [panel, setPanel] = useState<Panel>("none");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [websiteRatio, setWebsiteRatio] = useState("16:9");
  const [pageTitle, setPageTitle] = useState("");
  const [pageDescription, setPageDescription] = useState("");
  const [readUrl, setReadUrl] = useState("");
  const [originalUrl, setOriginalUrl] = useState("");
  const [viralRatio, setViralRatio] = useState("9:16");

  async function start(input: Omit<StudioStartInput, "businessId">) {
    setBusy(true);
    setError(null);
    const result = await startStudioAction({ ...input, businessId: brandId });
    setBusy(false);
    if (result.error || !result.projectId) {
      setError(result.error ?? "We couldn't start that advert.");
      return;
    }
    const params = new URLSearchParams({
      project: result.projectId,
      step: result.step ?? "campaign",
      lane: result.lane ?? "business",
    });
    router.push(`/dashboard/create?${params.toString()}`);
  }

  async function readWebsite() {
    setBusy(true);
    setError(null);
    const preview = await previewWebsiteForAdvert({ websiteUrl });
    setBusy(false);
    if (preview.error) {
      setError(preview.error);
      return;
    }
    setPageTitle(preview.title ?? "");
    setPageDescription(preview.description ?? "");
    setReadUrl(preview.url ?? websiteUrl);
  }

  return (
    <div className="mt-10 flex flex-col gap-14">
      {draftProjectId ? (
        <p className="text-sm text-muted">
          <button
            type="button"
            className="underline text-foreground"
            onClick={() => router.push(`/dashboard/create?project=${draftProjectId}`)}
          >
            {STUDIO_CONTINUE_DRAFT}
          </button>
        </p>
      ) : null}

      <div className="flex max-w-md flex-col gap-2">
        <Label htmlFor="studioBrand">Which business?</Label>
        <select
          id="studioBrand"
          className="h-11 rounded-md border border-border bg-surface px-3 text-base text-foreground"
          value={brandId}
          onChange={(event) => setBrandId(event.target.value)}
        >
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <StudioSection
        kicker="01"
        title={STUDIO_BUSINESS_HEADING}
        body={STUDIO_BUSINESS_BODY}
        methods={BUSINESS_METHODS}
        lane="business"
        busy={busy}
        onMethod={(id) => {
          if (id === "website") {
            setPanel("website");
            return;
          }
          setPanel("none");
          void start({ method: "motion" });
        }}
      />

      {panel === "website" ? (
        <form
          className="rounded-lg border border-border bg-surface p-6"
          onSubmit={(event) => {
            event.preventDefault();
            void start({
              method: "website",
              websiteUrl: readUrl || websiteUrl,
              aspectRatio: websiteRatio,
              pageTitle,
              pageDescription,
            });
          }}
        >
          <h3 className="font-display text-xl text-foreground">Website to advert</h3>
          <p className="mt-2 text-sm text-muted">{STUDIO_WEBSITE_HINT}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_10rem]">
            <div className="flex flex-col gap-2">
              <Label htmlFor="websiteUrl">Website</Label>
              <Input
                id="websiteUrl"
                type="url"
                required
                placeholder="https://"
                value={websiteUrl}
                onChange={(event) => {
                  setWebsiteUrl(event.target.value);
                  setPageTitle("");
                  setPageDescription("");
                  setReadUrl("");
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="websiteRatio">Format</Label>
              <select
                id="websiteRatio"
                className="h-11 rounded-md border border-border bg-surface px-3 text-base text-foreground"
                value={websiteRatio}
                onChange={(event) => setWebsiteRatio(event.target.value)}
              >
                {ASPECT_RATIOS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" variant="outline" busy={busy} onClick={() => void readWebsite()}>
              Read website
            </Button>
            <Button type="submit" busy={busy} disabled={!websiteUrl.trim()}>
              Continue to brief
            </Button>
          </div>
          {pageTitle || pageDescription ? (
            <dl className="mt-6 grid gap-3 text-sm">
              <div>
                <dt className="text-muted">Published title</dt>
                <dd className="text-foreground">{pageTitle || "None published"}</dd>
              </div>
              <div>
                <dt className="text-muted">Published description</dt>
                <dd className="text-foreground">{pageDescription || "None published"}</dd>
              </div>
            </dl>
          ) : null}
        </form>
      ) : null}

      <PresetRow
        lane="business"
        busy={busy}
        onPick={(presetId) => {
          setPanel("none");
          void start({ presetId });
        }}
      />

      <StudioSection
        kicker="02"
        title={STUDIO_VIRAL_HEADING}
        body={STUDIO_VIRAL_BODY}
        methods={VIRAL_METHODS}
        lane="viral"
        busy={busy}
        onMethod={(id) => {
          if (id === "reference") {
            setPanel("reference");
            return;
          }
          setPanel("none");
          void start({ method: "ugc" });
        }}
      />

      {panel === "reference" ? (
        <form
          className="rounded-lg border border-border bg-surface p-6"
          onSubmit={(event) => {
            event.preventDefault();
            void start({
              method: "reference",
              aspectRatio: viralRatio,
              originalAdvertUrl: originalUrl,
            });
          }}
        >
          <h3 className="font-display text-xl text-foreground">Recreate a viral advert</h3>
          <p className="mt-2 text-sm text-muted">{STUDIO_VIRAL_HINT}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="viralRatio">Format</Label>
              <select
                id="viralRatio"
                className="h-11 rounded-md border border-border bg-surface px-3 text-base text-foreground"
                value={viralRatio}
                onChange={(event) => setViralRatio(event.target.value)}
              >
                {ASPECT_RATIOS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="originalUrl">Link to the original advert (optional)</Label>
              <Input
                id="originalUrl"
                type="url"
                placeholder="https://"
                value={originalUrl}
                onChange={(event) => setOriginalUrl(event.target.value)}
              />
            </div>
          </div>
          <div className="mt-4">
            <Button type="submit" busy={busy}>
              Continue to references
            </Button>
          </div>
        </form>
      ) : null}

      <PresetRow
        lane="viral"
        busy={busy}
        onPick={(presetId) => {
          setPanel("none");
          void start({ presetId });
        }}
      />
    </div>
  );
}

function StudioSection({
  kicker,
  title,
  body,
  methods,
  lane,
  busy,
  onMethod,
}: {
  kicker: string;
  title: string;
  body: string;
  methods: readonly { id: string; label: string; description: string }[];
  lane: StudioLane;
  busy: boolean;
  onMethod: (id: string) => void;
}) {
  return (
    <section>
      <p className="text-xs font-medium tracking-[0.28em] text-accent">{kicker}</p>
      <h2 className="mt-3 font-display text-3xl text-foreground">{title}</h2>
      <p className="mt-3 max-w-2xl text-muted">{body}</p>
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {methods.map((method) => (
          <li key={method.id}>
            <button
              type="button"
              disabled={busy}
              onClick={() => onMethod(method.id)}
              className={cn(
                "flex min-h-36 w-full flex-col rounded-lg border border-border bg-surface p-5 text-left",
                "hover:border-accent focus-visible:outline-none",
                lane === "viral" ? "bg-surface-secondary" : undefined,
              )}
            >
              <span className="font-display text-xl text-foreground">{method.label}</span>
              <span className="mt-2 text-sm leading-6 text-muted">{method.description}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PresetRow({
  lane,
  busy,
  onPick,
}: {
  lane: StudioLane;
  busy: boolean;
  onPick: (id: string) => void;
}) {
  const presets = presetsForLane(lane);
  return (
    <div>
      <h3 className="text-sm font-medium tracking-[0.18em] text-muted uppercase">{STUDIO_PRESET_HEADING}</h3>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {presets.map((preset) => (
          <li key={preset.id}>
            <button
              type="button"
              disabled={busy}
              onClick={() => onPick(preset.id)}
              className="flex min-h-28 w-full flex-col rounded-md border border-border bg-surface-secondary p-4 text-left hover:border-accent"
            >
              <span className="text-foreground">{preset.label}</span>
              <span className="mt-1 text-sm text-muted">{preset.description}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
