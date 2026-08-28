"use client";

import { useState } from "react";
import { HOW_IT_WORKS_STEPS } from "@/lib/site/copy";
import { EXAMPLE_CLIPS } from "@/lib/site/example-videos";
import { cn } from "@/lib/utils";
import { VideoCard } from "./video-card";

export function WorkTabs() {
  const [active, setActive] = useState(0);
  const step = HOW_IT_WORKS_STEPS[active]!;
  const clip = EXAMPLE_CLIPS[active % EXAMPLE_CLIPS.length]!;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center">
      <div>
        <div role="tablist" aria-label="How it works" className="flex flex-col gap-2">
          {HOW_IT_WORKS_STEPS.map((item, index) => {
            const selected = index === active;
            return (
              <button
                key={item.number}
                type="button"
                role="tab"
                aria-selected={selected}
                id={`work-tab-${item.number}`}
                aria-controls="work-tab-panel"
                className={cn(
                  "rounded-[1.4rem] border px-5 py-4 text-left transition-colors",
                  selected
                    ? "border-[#2787FF] bg-white shadow-[0_16px_40px_rgba(17,26,49,0.08)]"
                    : "border-transparent bg-white/60 hover:bg-white",
                )}
                onClick={() => setActive(index)}
              >
                <p className="text-[11px] font-semibold tracking-[0.2em] text-[#2787FF]">{item.number}</p>
                <p className="mt-1 text-lg font-semibold text-[#111A31]">{item.title}</p>
                {selected ? <p className="mt-1.5 text-sm leading-6 text-[#5A6480]">{item.body}</p> : null}
              </button>
            );
          })}
        </div>
      </div>
      <div id="work-tab-panel" role="tabpanel" aria-labelledby={`work-tab-${step.number}`}>
        <VideoCard
          src={clip.src}
          title={step.title}
          subtitle={step.body}
          className="aspect-[16/10] min-h-[18rem] rounded-[1.75rem] shadow-[0_24px_60px_rgba(17,26,49,0.16)]"
        />
      </div>
    </div>
  );
}
