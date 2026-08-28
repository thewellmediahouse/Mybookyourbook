import type { ReactNode } from "react";
import { HOME_UI } from "@/lib/site/home";
import { StaticGraphic } from "@/components/site/static-graphic";
import { cn } from "@/lib/utils";

export function PhoneStage({
  src,
  alt,
  objectPosition = "center",
  priority = false,
  media = "image",
  label,
  className,
  children,
}: {
  src: string;
  alt: string;
  objectPosition?: string;
  priority?: boolean;
  media?: "image" | "video";
  label?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <figure className={cn("relative mx-auto w-[min(100%,13.5rem)] sm:w-[15.5rem] lg:w-[16.5rem]", className)}>
      {label ? (
        <figcaption className="mb-3 text-center text-[11px] font-semibold tracking-[0.22em] text-muted">
          {label}
        </figcaption>
      ) : null}
      <div className="relative aspect-[320/640]">
        <div className="absolute inset-[3.2%_6.9%] overflow-hidden rounded-[2.6rem] bg-surface">
          {media === "video" ? (
            <video
              src={src}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition }}
              autoPlay
              muted
              loop
              playsInline
              preload={priority ? "auto" : "metadata"}
              aria-label={alt}
            />
          ) : (
            <StaticGraphic
              src={src}
              alt={alt}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition }}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "low"}
            />
          )}
          {children}
        </div>
        <StaticGraphic
          src={HOME_UI.phoneFrame}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
      </div>
    </figure>
  );
}
