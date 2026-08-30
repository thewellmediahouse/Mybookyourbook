"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PhoneStage } from "@/components/site/phone-stage";
import { StaticGraphic } from "@/components/site/static-graphic";
import { HOME_ICONS, HOME_IMAGES, HOME_UI, HOME_VIDEOS } from "@/lib/site/home";
import { cn } from "@/lib/utils";

type ActiveClip = "first" | "second";

export function HeroPhoneSequence() {
  const rootRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLVideoElement>(null);
  const secondRef = useRef<HTMLVideoElement>(null);
  const activeRef = useRef<ActiveClip>("first");
  const finishedRef = useRef(false);
  const [active, setActive] = useState<ActiveClip>("first");
  const [needsPlay, setNeedsPlay] = useState(false);

  const setClip = useCallback((clip: ActiveClip) => {
    activeRef.current = clip;
    setActive(clip);
  }, []);

  const playClip = useCallback(async (clip: ActiveClip) => {
    if (finishedRef.current) {
      return;
    }
    const first = firstRef.current;
    const second = secondRef.current;
    if (!first || !second) {
      return;
    }
    const next = clip === "first" ? first : second;
    const other = clip === "first" ? second : first;
    other.pause();
    next.muted = false;
    next.currentTime = 0;
    try {
      await next.play();
      setClip(clip);
      setNeedsPlay(false);
    } catch {
      setNeedsPlay(true);
    }
  }, [setClip]);

  const finishSequence = useCallback(() => {
    finishedRef.current = true;
    firstRef.current?.pause();
    secondRef.current?.pause();
    setNeedsPlay(false);
  }, []);

  useEffect(() => {
    void playClip("first");
  }, [playClip]);

  useEffect(() => {
    const root = rootRef.current;
    const first = firstRef.current;
    const second = secondRef.current;
    if (!root || !first || !second) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          return;
        }
        if (finishedRef.current) {
          return;
        }
        const current = activeRef.current === "first" ? first : second;
        if (entry.isIntersecting) {
          if (!needsPlay) {
            current.muted = false;
            void current.play().catch(() => setNeedsPlay(true));
          }
        } else {
          first.pause();
          second.pause();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [needsPlay]);

  return (
    <div ref={rootRef} className="relative">
      <div className="flex items-end justify-center gap-2 sm:gap-4">
        <PhoneStage
          src={HOME_VIDEOS.heroSelfie}
          poster={HOME_IMAGES.heroSelfie}
          alt="A short vertical advert playing on a phone"
          media="video"
          priority
          label="YOUR SELFIE"
          videoRef={firstRef}
          muted={false}
          loop={false}
          autoPlay={false}
          onEnded={() => void playClip("second")}
          className={cn(active === "second" && "opacity-55")}
        />

        <StaticGraphic
          src={HOME_UI.transformationRibbon}
          alt=""
          className="sales-ribbon pointer-events-none absolute left-1/2 top-[42%] z-10 hidden w-[min(42%,11rem)] -translate-x-1/2 sm:block"
        />

        <PhoneStage
          src={HOME_VIDEOS.heroFinishedAd}
          poster={HOME_IMAGES.heroFinishedAd}
          alt="A finished professional advert playing on a phone"
          media="video"
          label="FINISHED AD"
          videoRef={secondRef}
          muted={false}
          loop={false}
          autoPlay={false}
          preload="none"
          onEnded={finishSequence}
          className={cn(active === "first" && "opacity-55")}
        />
      </div>

      {needsPlay ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#071225]/35">
          <button
            type="button"
            onClick={() => void playClip(activeRef.current)}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#2787FF] px-5 text-sm font-semibold text-[#001038]"
          >
            <StaticGraphic src={HOME_ICONS.play} alt="" width={18} height={18} className="size-[18px]" />
            Play
          </button>
        </div>
      ) : null}
    </div>
  );
}
