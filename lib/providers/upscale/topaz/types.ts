export type UpscaleCreateInput = {
  sourceBytes: Uint8Array;
  mimeType: string;
  aspectRatio: string;
  durationSeconds?: number;
};

export type UpscaleJob = {
  id: string;
  status: "created" | "accepted" | "uploading" | "processing" | "complete" | "failed";
  uploadUrls?: string[];
};

export type UpscaleResult = {
  id: string;
  bytes: Uint8Array;
  mimeType: string;
};

export interface UpscaleProvider {
  create(input: UpscaleCreateInput): Promise<UpscaleJob>;
  accept(id: string): Promise<UpscaleJob>;
  upload(id: string, bytes: Uint8Array, uploadUrls?: string[]): Promise<UpscaleJob>;
  completeUpload(id: string): Promise<UpscaleJob>;
  poll(id: string): Promise<UpscaleJob>;
  complete(id: string): Promise<UpscaleJob>;
  retrieve(id: string): Promise<UpscaleResult>;
}
