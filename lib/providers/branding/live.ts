import { FIXTURE_VIDEO_MIME } from "@/lib/providers/video/fixture";
import { decodeBrandingEnvelope } from "./envelope";
import { brandingTextLines, overlayLogoPosition, shouldIncludeEndCard } from "./overlay";
import type { BrandingContainerRequest, BrandingInput, BrandingProvider, BrandingResult } from "./types";

const CUSTOMER_UNAVAILABLE = "We couldn't add your brand right now. Please try again later.";
const INTERNAL_HEADER = "X-Internal-Secret";

function asBytes(value: Uint8Array | null | undefined): Uint8Array | null {
  return value && value.byteLength > 0 ? value : null;
}

export function createContainerBrandingProvider(input: {
  secret: string;
  request: BrandingContainerRequest;
}): BrandingProvider {
  const secret = input.secret.trim();

  return {
    async apply(createInput: BrandingInput): Promise<BrandingResult> {
      if (!secret) {
        throw new Error(CUSTOMER_UNAVAILABLE);
      }
      const lines = brandingTextLines(createInput);
      const logoBytes = asBytes(createInput.logoBytes ?? null);
      const form = new FormData();
      form.set(
        "video",
        new Blob([Buffer.from(createInput.sourceBytes)], { type: createInput.mimeType || FIXTURE_VIDEO_MIME }),
        "source.mp4",
      );
      if (logoBytes) {
        form.set(
          "logo",
          new Blob([Buffer.from(logoBytes)], { type: createInput.logoMimeType || "image/png" }),
          "logo",
        );
      }
      form.set(
        "options",
        JSON.stringify({
          businessName: createInput.businessName.trim(),
          logoPosition: overlayLogoPosition(createInput.logoPosition, Boolean(logoBytes)),
          lines,
          includeEndCard: shouldIncludeEndCard(lines),
        }),
      );
      const response = await input.request("/brand", {
        method: "POST",
        headers: { [INTERNAL_HEADER]: secret },
        body: form,
      });
      if (!response.ok) {
        throw new Error(CUSTOMER_UNAVAILABLE);
      }
      const packed = new Uint8Array(await response.arrayBuffer());
      const decoded = decodeBrandingEnvelope(packed);
      return {
        bytes: decoded.videoBytes,
        mimeType: FIXTURE_VIDEO_MIME,
        thumbnailBytes: decoded.thumbnailBytes,
        thumbnailMimeType: response.headers.get("X-Thumbnail-Type") || "image/jpeg",
        media: {
          ...decoded.meta,
          sizeBytes: decoded.videoBytes.byteLength,
        },
      };
    },
  };
}
