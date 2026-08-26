"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function VideoCard({
  src,
  title,
  subtitle,
  className,
  autoPlay = true,
}: {
  src: string;
  title?: string;
  subtitle?: string;
  className?: string;
  autoPlay?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !autoPlay) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          return;
        }
        if (entry.isIntersecting) {
          void node.play().catch(() => undefined);
        } else {
          node.pause();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [autoPlay]);

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-overlay",
        className ?? "aspect-video min-w-[16rem] sm:min-w-[22rem]",
      )}
    >
      <video
        ref={ref}
        src={src}
        className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-[1.03]"
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-overlay via-overlay/25 to-transparent" />
      {title ? (
        <div className="relative mt-auto flex h-full flex-col justify-end p-4 sm:p-5">
          <h3 className="text-base font-semibold tracking-tight text-overlay-text sm:text-lg">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-overlay-muted">{subtitle}</p> : null}
        </div>
      ) : null}
    </article>
  );
}
