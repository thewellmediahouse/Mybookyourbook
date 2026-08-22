export type ProviderSubmission = {
  id: string;
  status: "queued" | "processing" | "complete" | "failed";
};

export type ProviderStatus = {
  id: string;
  status: "queued" | "processing" | "complete" | "failed";
  error?: string;
};

export type ProviderResult = {
  id: string;
  bytes: Uint8Array;
  mimeType: string;
};

export type VideoSubmitInput = {
  prompt: string;
  aspectRatio: string;
  durationSeconds: number;
  imageUrls: string[];
  videoUrls: string[];
};

export interface VideoGenerationProvider {
  submit(input: VideoSubmitInput): Promise<ProviderSubmission>;
  getStatus(id: string): Promise<ProviderStatus>;
  getResult(id: string): Promise<ProviderResult>;
}
