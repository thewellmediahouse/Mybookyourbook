"use client";

import Image from "next/image";
import { useRef } from "react";
import { HomeFrame } from "@/components/site/home-frame";
import { HOME_BACKGROUNDS, HOME_ICONS, HOME_STYLES } from "@/lib/site/home";
import { StaticGraphic } from "@/components/site/static-graphic";

export function StyleCarousel() {
  const scroller = useRef<HTMLDivElement>(null);

  function scrollByCard(direction: -1 | 1) {
    const node = scroller.current;
    if (!node) {
      return;
    }
    const card = node.querySelector("article");
    const amount = (card instanceof HTMLElement ? card.offsetWidth : 220) + 16;
    node.scrollBy({ left: amount * direction, behavior: "smooth" });
  }

  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-35"
        style={{ backgroundImage: `url(${HOME_BACKGROUNDS.lightFlow})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-[#F7F8FC]" aria-hidden />
      <HomeFrame className="relative">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-[#111A31] sm:text-4xl">
              Choose a look. Keep your identity.
            </h2>
            <p className="mt-3 max-w-lg text-base leading-7 text-[#5A6480]">
              Use a built-in reference or upload your own.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-full border border-[#111A31]/15 bg-white"
              aria-label="Previous looks"
              onClick={() => scrollByCard(-1)}
            >
              <StaticGraphic src={HOME_ICONS.arrowLeft} alt="" width={18} height={18} />
            </button>
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-full border border-[#111A31]/15 bg-white"
              aria-label="Next looks"
              onClick={() => scrollByCard(1)}
            >
              <StaticGraphic src={HOME_ICONS.arrowRight} alt="" width={18} height={18} />
            </button>
          </div>
        </div>
        <div
          ref={scroller}
          className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scrollbar-none"
        >
          {HOME_STYLES.map((style) => (
            <article
              key={style.id}
              className="relative h-[22rem] w-[min(70vw,16.5rem)] shrink-0 snap-start overflow-hidden rounded-[1.6rem] sm:h-[26rem]"
            >
              <Image
                src={style.image}
                alt={`${style.label} look`}
                fill
                sizes="264px"
                className="object-cover"
                style={{ objectPosition: style.objectPosition }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 py-5">
                <p className="text-lg font-semibold text-[#F7F8FC]">{style.label}</p>
              </div>
            </article>
          ))}
        </div>
      </HomeFrame>
    </section>
  );
}
