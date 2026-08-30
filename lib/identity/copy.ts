export const IDENTITY_HEADING = "Your Reference Profile";
export const IDENTITY_BODY =
  "We use this profile every time we film you: your selfie video, face photos, logo, and extra photos or clips of your business.";

export const CONSENT_LIKENESS =
  "I confirm that I am the person shown and heard in these reference files, or that I have explicit permission from this person to use their likeness and voice for commercial advertising.";
export const CONSENT_PROCESSING =
  "I understand that these references may be processed by external AI and media-processing services to create my requested commercial.";
export const CONSENT_IMPERSONATION =
  "I agree not to use Production30 to impersonate another person without authorization.";
export const CONSENT_ADULT = "I confirm that the person shown and heard is an adult.";

export const CONSENT_VERSION = "identity-v1";

export const VIDEO_PROMPT_TEMPLATE =
  "Hi, I'm {name} from {business}. We help our clients get better results through what we do.";

export function videoPrompt(name: string, business: string): string {
  return VIDEO_PROMPT_TEMPLATE.replace("{name}", name).replace("{business}", business);
}

export const PHOTO_GUIDES = {
  IDENTITY_FRONT: {
    title: "Image 1 — Front",
    instruction: "Look directly at the camera.",
  },
  IDENTITY_LEFT: {
    title: "Image 2 — Left angle",
    instruction: "Turn approximately 45° to your left.",
  },
  IDENTITY_RIGHT: {
    title: "Image 3 — Right angle",
    instruction: "Turn approximately 45° to your right.",
  },
} as const;

export const VIDEO_MIN_SECONDS = 8;
export const VIDEO_MAX_SECONDS = 15;
export const VIDEO_MAX_BYTES = 40 * 1024 * 1024;
export const PHOTO_MAX_BYTES = 8 * 1024 * 1024;
