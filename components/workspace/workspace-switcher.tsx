"use client";

import { switchWorkspace } from "@/app/dashboard/actions";
import type { WorkspaceListItem } from "@/lib/workspaces/queries";

export function WorkspaceSwitcher({
  workspaces,
  activeId,
}: {
  workspaces: WorkspaceListItem[];
  activeId: string;
}) {
  if (workspaces.length < 2) {
    return null;
  }

  return (
    <form action={switchWorkspace} className="flex flex-col gap-1.5">
      <label htmlFor="workspaceId" className="text-xs tracking-[0.12em] text-muted">
        STUDIO
      </label>
      <select
        id="workspaceId"
        name="workspaceId"
        defaultValue={activeId}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-11 w-full max-w-56 rounded-md border border-border bg-surface px-3 text-sm text-foreground lg:max-w-none"
      >
        {workspaces.map((item) => (
          <option key={item.workspaceId} value={item.workspaceId}>
            {item.name}
          </option>
        ))}
      </select>
    </form>
  );
}
