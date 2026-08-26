"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function BeforeAfterCompare({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  const labelId = useId();
  const frameRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLVideoElement>(null);
  const beforeRef = useRef<HTMLVideoElement>(null);
  const dragging = useRef(false);
  const [position, setPosition] = useState(50);

  useEffect(() => {
    const after = afterRef.current;
    const before = beforeRef.current;
    if (!after || !before) {
      return;
    }
    const sync = () => {
      if (Math.abs(after.currentTime - before.currentTime) > 0.12) {
        before.currentTime = after.currentTime;
      }
    };
    after.addEventListener("timeupdate", sync);
    return () => after.removeEventListener("timeupdate", sync);
  }, []);

  const moveTo = useCallback((clientX: number) => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }
    const rect = frame.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(90, Math.max(10, next)));
  }, []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!dragging.current) {
        return;
      }
      moveTo(event.clientX);
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [moveTo]);

  return (
    <div
      ref={frameRef}
      className={cn(
        "relative aspect-video touch-none overflow-hidden rounded-[1.75rem] bg-overlay shadow-[0_28px_80px_rgba(0,16,56,0.16)] ring-1 ring-border",
        className,
      )}
      onPointerDown={(event) => {
        dragging.current = true;
        moveTo(event.clientX);
      }}
    >
      <video
        ref={afterRef}
        src={src}
        className="pointer-events-none absolute inset-0 size-full object-cover"
        muted
        loop
        autoPlay
        playsInline
        preload="metadata"
      />
      <video
        ref={beforeRef}
        src={src}
        className="pointer-events-none absolute inset-0 size-full origin-center object-cover"
        style={{
          clipPath: `inset(0 ${100 - position}% 0 0)`,
          filter: "contrast(0.72) saturate(0.5) brightness(0.95) blur(1.1px)",
          transform: "scale(1.04)",
        }}
        muted
        loop
        autoPlay
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 bg-overlay/20"
        style={{ width: `${position}%` }}
      />
      <p className="absolute top-4 left-4 rounded-full bg-overlay/80 px-3 py-1 text-xs font-medium tracking-wide text-overlay-text">
        Before finishing
      </p>
      <p className="absolute top-4 right-4 rounded-full bg-overlay/80 px-3 py-1 text-xs font-medium tracking-wide text-overlay-text">
        Finished look
      </p>
      <div
        className="absolute inset-y-0 z-10 w-px bg-overlay-text"
        style={{ left: `${position}%` }}
      >
        <button
          type="button"
          aria-labelledby={labelId}
          aria-valuemin={10}
          aria-valuemax={90}
          aria-valuenow={Math.round(position)}
          role="slider"
          className="absolute top-1/2 left-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            dragging.current = true;
            moveTo(event.clientX);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              setPosition((value) => Math.max(10, value - 4));
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              setPosition((value) => Math.min(90, value + 4));
            }
          }}
        >
          <span className="sr-only" id={labelId}>
            Compare before and after
          </span>
          <span aria-hidden="true" className="text-base font-semibold">
            ‹ ›
          </span>
        </button>
      </div>
    </div>
  );
}
