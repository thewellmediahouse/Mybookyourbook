import { FIXTURE_JPEG, FIXTURE_IMAGE_MIME, FIXTURE_MP4, FIXTURE_VIDEO_MIME } from "@/lib/providers/video/fixture";
import type { BrandingInput, BrandingProvider, BrandingResult } from "./types";

export function createMockBrandingProvider(options?: { failure?: boolean }): BrandingProvider {
  return {
    async apply(input: BrandingInput): Promise<BrandingResult> {
      if (options?.failure) {
        throw new Error("BRANDING_FAILED");
      }
      const bytes = input.sourceBytes.length ? input.sourceBytes : FIXTURE_MP4;
      return {
        bytes,
        mimeType: input.mimeType || FIXTURE_VIDEO_MIME,
        thumbnailBytes: FIXTURE_JPEG,
        thumbnailMimeType: FIXTURE_IMAGE_MIME,
        media: {
          width: null,
          height: null,
          durationSeconds: 30,
          fps: null,
          videoCodec: null,
          audioCodec: null,
          container: "mp4",
          sizeBytes: bytes.byteLength,
        },
      };
    },
  };
}
