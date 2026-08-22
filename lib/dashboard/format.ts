export function formatStudioDate(value: Date | null | undefined): string {
  if (!value) {
    return "Not set";
  }
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

export function formatDurationSeconds(seconds: number): string {
  return `${seconds} seconds`;
}

export function formatCommercialFormat(input: {
  aspectRatio: string | null;
  platform: string | null;
}): string {
  if (input.aspectRatio && input.platform) {
    return `${input.aspectRatio} · ${input.platform}`;
  }
  return input.aspectRatio ?? input.platform ?? "Format not set";
}

export function formatCampaignCta(ctaType: string | null | undefined, ctaValue: string | null | undefined): string {
  const type = ctaType?.trim() ?? "";
  const value = ctaValue?.trim() ?? "";
  if (type && value) {
    return `${type} · ${value}`;
  }
  return type || value || "Not set";
}

export function asCount(value: number | bigint | string | null | undefined): number {
  if (typeof value === "bigint") {
    return Number(value);
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return value ?? 0;
}
