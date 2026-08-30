"use client";

import { useState, type ReactNode } from "react";
import { StudioGallery } from "@/components/create/studio-gallery";
import type { CommercialListItem } from "@/lib/dashboard/summary";
import { isInProductionStatus } from "@/lib/projects/status";
import { cn } from "@/lib/utils";

export function StudioBoard({
  wizard,
  items,
  canDelete,
  canProduce,
  credits,
  produceBlockedReason,
}: {
  wizard: ReactNode;
  items: CommercialListItem[];
  canDelete: boolean;
  canProduce: boolean;
  credits: number;
  produceBlockedReason?: string;
}) {
  const filming = items.some((item) => isInProductionStatus(item.status));
  const [pane, setPane] = useState<"create" | "videos">(filming ? "videos" : "create");

  return (
    <div className="flex min-h-[calc(100svh-4.5rem)] flex-col lg:h-[calc(100svh)] lg:min-h-0 lg:flex-row">
      <div className="grid grid-cols-2 gap-2 px-4 pt-3 lg:hidden">
        <PaneTab selected={pane === "create"} onClick={() => setPane("create")}>
          Create
        </PaneTab>
        <PaneTab selected={pane === "videos"} onClick={() => setPane("videos")}>
          Your videos{items.length > 0 ? ` (${items.length})` : ""}
        </PaneTab>
      </div>
      <aside
        className={cn(
          "w-full shrink-0 border-b border-border lg:block lg:h-full lg:w-[26rem] lg:overflow-y-auto lg:border-b-0 lg:border-r xl:w-[28rem]",
          pane === "create" ? "block" : "hidden",
        )}
      >
        <div className="px-4 py-4 lg:px-6 lg:py-6">{wizard}</div>
      </aside>
      <section
        className={cn(
          "min-w-0 flex-1 px-4 py-4 lg:block lg:overflow-y-auto lg:px-8 lg:py-8",
          pane === "videos" ? "block" : "hidden",
        )}
      >
        <StudioGallery
          items={items}
          canDelete={canDelete}
          canProduce={canProduce}
          credits={credits}
          produceBlockedReason={produceBlockedReason}
        />
      </section>
    </div>
  );
}

function PaneTab({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-full border px-3 text-sm",
        selected ? "border-accent bg-surface text-foreground" : "border-border bg-background text-muted",
      )}
    >
      {children}
    </button>
  );
}
