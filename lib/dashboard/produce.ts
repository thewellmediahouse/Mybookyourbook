import { canProduce, type WorkspaceRole } from "@/lib/authz/roles";
import { VIEWER_CANNOT_CREATE } from "./copy";

export type ProduceAvailability =
  | { allowed: true }
  | { allowed: false; reason: string };

export function produceAvailability(input: {
  role: WorkspaceRole;
  memberStatus: string;
  workspaceStatus: string;
}): ProduceAvailability {
  if (input.workspaceStatus !== "active") {
    return { allowed: false, reason: "This studio is paused, so production cannot start." };
  }
  if (input.memberStatus !== "active") {
    return { allowed: false, reason: "This account is paused, so production cannot start." };
  }
  if (!canProduce(input.role)) {
    return { allowed: false, reason: VIEWER_CANNOT_CREATE };
  }
  return { allowed: true };
}
