export function commercialDownloadFilename(businessName: string, campaignTitle: string): string {
  return `production30-${slugPart(businessName, "studio")}-${slugPart(campaignTitle, "commercial")}.mp4`;
}

export function contentDisposition(kind: "inline" | "attachment", filename?: string): string {
  if (!filename) {
    return kind;
  }
  const safe = filename.replace(/["\\\r\n]/g, "_");
  return `${kind}; filename="${safe}"`;
}

export function finalCommercialFilename(input: {
  category: string;
  role: string;
  businessName?: string | null;
  campaignTitle?: string | null;
  mimeType: string;
}): string | undefined {
  if (input.category === "final" || input.role === "master") {
    return commercialDownloadFilename(input.businessName ?? "", input.campaignTitle ?? "");
  }
  if (input.mimeType.startsWith("video/")) {
    return "production30-commercial.mp4";
  }
  return undefined;
}

export function assetStreamHeaders(input: {
  mimeType: string;
  sizeBytes: number;
  download: boolean;
  filename?: string;
}): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": input.mimeType,
    "Cache-Control": "private, max-age=60",
    "Accept-Ranges": "bytes",
    "Content-Disposition": contentDisposition(
      input.download ? "attachment" : "inline",
      input.download ? input.filename : undefined,
    ),
  };
  if (input.sizeBytes > 0) {
    headers["Content-Length"] = String(input.sizeBytes);
  }
  return headers;
}

function slugPart(value: string, fallback: string): string {
  const cleaned = value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return cleaned || fallback;
}
