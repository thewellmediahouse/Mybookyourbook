import type { IdentityRole } from "@/lib/r2/keys";

export const IDENTITY_SLOTS: IdentityRole[] = [
  "IDENTITY_FRONT",
  "IDENTITY_LEFT",
  "IDENTITY_RIGHT",
  "IDENTITY_VIDEO",
];

export const PHOTO_SLOTS: IdentityRole[] = ["IDENTITY_FRONT", "IDENTITY_LEFT", "IDENTITY_RIGHT"];

/** Internal mapping only. Never shown to customers. */
export const IDENTITY_REFERENCE_MAP: Record<IdentityRole, string> = {
  IDENTITY_FRONT: "@Image1",
  IDENTITY_LEFT: "@Image2",
  IDENTITY_RIGHT: "@Image3",
  IDENTITY_VIDEO: "@Video1",
};

export function parseIdentitySlot(value: string): IdentityRole | null {
  const key = value.trim().toUpperCase();
  if (key === "FRONT") {
    return "IDENTITY_FRONT";
  }
  if (key === "LEFT") {
    return "IDENTITY_LEFT";
  }
  if (key === "RIGHT") {
    return "IDENTITY_RIGHT";
  }
  if (key === "VIDEO") {
    return "IDENTITY_VIDEO";
  }
  if (IDENTITY_SLOTS.includes(key as IdentityRole)) {
    return key as IdentityRole;
  }
  return null;
}

export function slotPath(role: IdentityRole): string {
  if (role === "IDENTITY_FRONT") {
    return "front";
  }
  if (role === "IDENTITY_LEFT") {
    return "left";
  }
  if (role === "IDENTITY_RIGHT") {
    return "right";
  }
  return "video";
}
