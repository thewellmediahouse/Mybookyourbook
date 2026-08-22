import type { AdStrategy } from "@/lib/ai/ad-strategies";

export type CreativeBrief = {
  businessName: string;
  industry: string | null;
  campaignTitle: string;
  advertisingType: string;
  targetCustomer: string;
  problem: string;
  valueProposition: string;
  offer: string;
  ctaType: string;
  ctaValue: string;
  style: string;
  tones: string[];
  avoid: string;
  platform: string;
  aspectRatio: string;
  durationSeconds: number;
  strategy: AdStrategy;
};

export type ConceptScene = {
  startSecond: number;
  endSecond: number;
  visual: string;
  presenterAction: string | null;
  camera: string;
  dialogue: string | null;
  audio: string | null;
};

export type CreativeConcept = {
  title: string;
  hook: string;
  strategy: string;
  spokenScript: string;
  scenes: ConceptScene[];
  callToAction: string;
  generationPrompt: string;
};

export type PublicCreativeConcept = Omit<CreativeConcept, "generationPrompt"> & {
  versionId: string;
  version: number;
  approved: boolean;
};

export interface CreativeDirectorProvider {
  generateConcept(input: CreativeBrief): Promise<CreativeConcept>;
}
