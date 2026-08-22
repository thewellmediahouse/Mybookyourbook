import type { ReactNode } from "react";
import { PublicFrame } from "./public-frame";

export function MediaRail({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <PublicFrame className="flex items-end justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h2>
        {action}
      </PublicFrame>
      <PublicFrame className="mt-5 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex snap-x snap-mandatory gap-4">{children}</div>
      </PublicFrame>
    </section>
  );
}
