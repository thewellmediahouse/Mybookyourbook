"use client";

import { cn } from "@/lib/utils";

export function HeroVideo({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-video overflow-hidden rounded-[1.75rem] bg-overlay shadow-[0_28px_80px_rgba(0,16,56,0.16)] ring-1 ring-border",
        className,
      )}
    >
      <video
        src={src}
        className="absolute inset-0 size-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        controls
        preload="metadata"
        aria-label="Finished Production30 commercial"
      />
    </div>
  );
}
