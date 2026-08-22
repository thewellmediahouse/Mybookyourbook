import type { WorkspaceRole } from "@/lib/authz/roles";
import { canManageLibrary } from "@/lib/authz/roles";
import {
  LIBRARY_NO_BRAND_REASON,
  LIBRARY_PAUSED_REASON,
  LIBRARY_VIEWER_REASON,
} from "./copy";

export function libraryWriteAvailability(input: {
  role: WorkspaceRole;
  memberStatus: string;
  brandId: string | null;
}): { allowed: true } | { allowed: false; reason: string } {
  if (!input.brandId) {
    return { allowed: false, reason: LIBRARY_NO_BRAND_REASON };
  }
  if (input.memberStatus !== "active") {
    return { allowed: false, reason: LIBRARY_PAUSED_REASON };
  }
  if (!canManageLibrary(input.role)) {
    return { allowed: false, reason: LIBRARY_VIEWER_REASON };
  }
  return { allowed: true };
}
