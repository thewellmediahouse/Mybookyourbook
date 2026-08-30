import type { ReactNode } from "react";
import { StudioGallery } from "@/components/create/studio-gallery";
import type { CommercialListItem } from "@/lib/dashboard/summary";

export function StudioBoard({
  wizard,
  items,
  canDelete,
}: {
  wizard: ReactNode;
  items: CommercialListItem[];
  canDelete: boolean;
}) {
  return (
    <div className="flex min-h-[calc(100svh-4.5rem)] flex-col lg:h-[calc(100svh)] lg:min-h-0 lg:flex-row">
      <aside className="w-full shrink-0 border-b border-border lg:h-full lg:w-[26rem] lg:overflow-y-auto lg:border-b-0 lg:border-r xl:w-[28rem]">
        <div className="px-5 py-6 lg:px-6">{wizard}</div>
      </aside>
      <section className="min-w-0 flex-1 px-5 py-6 lg:overflow-y-auto lg:px-8 lg:py-8">
        <StudioGallery items={items} canDelete={canDelete} />
      </section>
    </div>
  );
}
