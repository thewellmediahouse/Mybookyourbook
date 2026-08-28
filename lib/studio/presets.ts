import { parsePublicHttpUrl } from "@/lib/importers/page-meta";
import {
  DEFAULT_DURATION,
  isAspectRatio,
  type AdStyle,
  type AdvertisingType,
  type AspectRatio,
  type PlatformOption,
  type ToneOption,
} from "@/lib/projects/brief";
import type { BriefInput as SaveBriefInput } from "@/lib/projects/save";

export const STUDIO_LANES = ["business", "viral"] as const;
export type StudioLane = (typeof STUDIO_LANES)[number];

export type StudioPreset = {
  id: string;
  lane: StudioLane;
  label: string;
  description: string;
  brief: SaveBriefInput;
};

function brief(input: {
  title?: string;
  objective: AdvertisingType;
  style: AdStyle;
  tones: ToneOption[];
  platform: PlatformOption;
  aspectRatio: AspectRatio;
  duration?: number;
  problem?: string;
  ctaType?: SaveBriefInput["ctaType"];
}): SaveBriefInput {
  return {
    title: input.title,
    objective: input.objective,
    style: input.style,
    tones: input.tones,
    platform: input.platform,
    aspectRatio: input.aspectRatio,
    duration: input.duration ?? DEFAULT_DURATION,
    problem: input.problem,
    ctaType: input.ctaType,
  };
}

export const BUSINESS_METHODS = [
  {
    id: "website",
    label: "Website to advert",
    description: "Add your website, choose a format, and we fill what the page actually publishes.",
  },
  {
    id: "motion",
    label: "Motion design",
    description: "Brief a product or service advert, then approve a scene-by-scene concept.",
  },
] as const;

export const VIRAL_METHODS = [
  {
    id: "reference",
    label: "Recreate a viral advert",
    description: "Add stills from an advert you like. We remake the structure with you and your business on camera.",
  },
  {
    id: "ugc",
    label: "Lifestyle UGC",
    description: "A vertical, spoken advert for Reels or TikTok, starring you.",
  },
] as const;

export const STUDIO_PRESETS: StudioPreset[] = [
  {
    id: "tvc",
    lane: "business",
    label: "TVC",
    description: "A 30-second landscape advert for YouTube or your website.",
    brief: brief({
      objective: "Business",
      style: "Cinematic",
      tones: ["Authoritative", "Confident"],
      platform: "YouTube",
      aspectRatio: "16:9",
      duration: 30,
    }),
  },
  {
    id: "cinematic",
    lane: "business",
    label: "Cinematic",
    description: "Polished lighting and camera, still starring you.",
    brief: brief({
      objective: "Brand awareness",
      style: "Cinematic",
      tones: ["Sophisticated"],
      platform: "Website",
      aspectRatio: "16:9",
      duration: 30,
    }),
  },
  {
    id: "corporate",
    lane: "business",
    label: "Corporate",
    description: "A clear business advert for LinkedIn or the company site.",
    brief: brief({
      objective: "Business",
      style: "Corporate",
      tones: ["Serious", "Confident"],
      platform: "LinkedIn",
      aspectRatio: "16:9",
      duration: 30,
    }),
  },
  {
    id: "environments",
    lane: "business",
    label: "Environments",
    description: "Show the place: showroom, site, restaurant, or office.",
    brief: brief({
      objective: "New location",
      style: "Professional",
      tones: ["Warm"],
      platform: "Website",
      aspectRatio: "16:9",
      duration: 30,
    }),
  },
  {
    id: "motion-studio",
    lane: "business",
    label: "Motion Studio",
    description: "A product or service advert with clear motion, still starring you.",
    brief: brief({
      objective: "Product",
      style: "Professional",
      tones: ["Confident", "Energetic"],
      platform: "Website",
      aspectRatio: "16:9",
      duration: 30,
    }),
  },
  {
    id: "creative-studio",
    lane: "business",
    label: "Creative Studio",
    description: "A bolder brand look for the company site or YouTube.",
    brief: brief({
      objective: "Brand awareness",
      style: "Luxury",
      tones: ["Sophisticated"],
      platform: "YouTube",
      aspectRatio: "16:9",
      duration: 30,
    }),
  },
  {
    id: "ugc",
    lane: "viral",
    label: "Lifestyle UGC",
    description: "A vertical talking advert that feels like a social post.",
    brief: brief({
      objective: "Brand awareness",
      style: "Social",
      tones: ["Friendly", "Energetic"],
      platform: "Instagram/Facebook Reels",
      aspectRatio: "9:16",
      duration: 15,
    }),
  },
  {
    id: "high-energy",
    lane: "viral",
    label: "High energy",
    description: "Fast, punchy, made for TikTok.",
    brief: brief({
      objective: "Product",
      style: "High Energy",
      tones: ["Energetic"],
      platform: "TikTok",
      aspectRatio: "9:16",
      duration: 15,
    }),
  },
  {
    id: "funny",
    lane: "viral",
    label: "Funny",
    description: "A short comic hook, still a real business offer.",
    brief: brief({
      objective: "Brand awareness",
      style: "Funny",
      tones: ["Friendly"],
      platform: "TikTok",
      aspectRatio: "9:16",
      duration: 15,
    }),
  },
];

export const MOTION_DEFAULTS: SaveBriefInput = brief({
  objective: "Product",
  style: "Professional",
  tones: ["Confident"],
  platform: "Website",
  aspectRatio: "16:9",
  duration: 30,
});

export const VIRAL_REFERENCE_DEFAULTS: SaveBriefInput = brief({
  objective: "Brand awareness",
  style: "Social",
  tones: ["Energetic"],
  platform: "TikTok",
  aspectRatio: "9:16",
  duration: 15,
  problem:
    "Remake the structure and pacing of the reference stills using our business and the presenter from AI Identity. Do not copy trademarks, logos, or readable text from the original advert.",
});

export const WEBSITE_DEFAULTS: SaveBriefInput = brief({
  objective: "Product",
  style: "Professional",
  tones: ["Confident"],
  platform: "Website",
  aspectRatio: "16:9",
  duration: 30,
  ctaType: "Visit Website",
});

export function isStudioLane(value: string): value is StudioLane {
  return (STUDIO_LANES as readonly string[]).includes(value);
}

export function studioPresetById(id: string): StudioPreset | null {
  return STUDIO_PRESETS.find((item) => item.id === id) ?? null;
}

export function presetsForLane(lane: StudioLane): StudioPreset[] {
  return STUDIO_PRESETS.filter((item) => item.lane === lane);
}

export type StudioStartInput = {
  businessId: string;
  presetId?: string;
  method?: "motion" | "website" | "reference" | "ugc";
  aspectRatio?: string;
  websiteUrl?: string;
  originalAdvertUrl?: string;
  pageTitle?: string;
  pageDescription?: string;
};

export type StudioStartResult =
  | { ok: true; patch: SaveBriefInput; step: string; lane: StudioLane }
  | { ok: false; error: string };

export function buildStudioStart(input: StudioStartInput): StudioStartResult {
  if (!input.businessId.trim()) {
    return { ok: false, error: "Choose which business this commercial is for." };
  }
  if (input.aspectRatio && !isAspectRatio(input.aspectRatio)) {
    return { ok: false, error: "Choose 9:16, 16:9, or 1:1. We do not pick the shape for you." };
  }

  if (input.presetId) {
    const preset = studioPresetById(input.presetId);
    if (!preset) {
      return { ok: false, error: "That look is not available." };
    }
    return {
      ok: true,
      patch: { ...preset.brief, businessId: input.businessId },
      step: "goal",
      lane: preset.lane,
    };
  }

  if (input.method === "motion") {
    return {
      ok: true,
      patch: { ...MOTION_DEFAULTS, businessId: input.businessId },
      step: "campaign",
      lane: "business",
    };
  }

  if (input.method === "ugc") {
    const preset = studioPresetById("ugc");
    return {
      ok: true,
      patch: { ...(preset?.brief ?? VIRAL_REFERENCE_DEFAULTS), businessId: input.businessId },
      step: "goal",
      lane: "viral",
    };
  }

  if (input.method === "reference") {
    const original = input.originalAdvertUrl?.trim();
    if (original && !parsePublicHttpUrl(original)) {
      return { ok: false, error: "Use a normal website address for the original advert." };
    }
    const problem = VIRAL_REFERENCE_DEFAULTS.problem ?? "";
    return {
      ok: true,
      patch: {
        ...VIRAL_REFERENCE_DEFAULTS,
        businessId: input.businessId,
        aspectRatio: input.aspectRatio || VIRAL_REFERENCE_DEFAULTS.aspectRatio,
        problem: original ? `${problem} Original advert for pacing only: ${original}` : problem,
      },
      step: "references",
      lane: "viral",
    };
  }

  if (input.method === "website") {
    const parsed = parsePublicHttpUrl(input.websiteUrl ?? "");
    if (!parsed) {
      return { ok: false, error: "Enter a website address first." };
    }
    return {
      ok: true,
      patch: {
        ...WEBSITE_DEFAULTS,
        businessId: input.businessId,
        aspectRatio: input.aspectRatio || WEBSITE_DEFAULTS.aspectRatio,
        title: input.pageTitle?.trim() || undefined,
        valueProposition: input.pageDescription?.trim() || undefined,
        ctaType: "Visit Website",
        ctaValue: parsed.toString(),
      },
      step: "goal",
      lane: "business",
    };
  }

  return { ok: false, error: "Choose how you want to start this advert." };
}
