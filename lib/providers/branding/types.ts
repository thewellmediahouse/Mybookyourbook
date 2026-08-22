import type { LogoPosition } from "@/lib/businesses/fields";

export type BrandingInput = {
  sourceBytes: Uint8Array;
  mimeType: string;
  businessName: string;
  ctaValue?: string | null;
  phone?: string | null;
  website?: string | null;
  whatsapp?: string | null;
  logoPosition: LogoPosition;
  logoBytes?: Uint8Array | null;
  logoMimeType?: string | null;
  jobId?: string;
};

export type BrandingMediaInfo = {
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  fps: number | null;
  videoCodec: string | null;
  audioCodec: string | null;
  container: string | null;
  sizeBytes: number;
};

export type BrandingResult = {
  bytes: Uint8Array;
  mimeType: string;
  thumbnailBytes: Uint8Array;
  thumbnailMimeType: string;
  media: BrandingMediaInfo;
};

export interface BrandingProvider {
  apply(input: BrandingInput): Promise<BrandingResult>;
}

export type BrandingContainerRequest = (path: string, init: RequestInit) => Promise<Response>;
