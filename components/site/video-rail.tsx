import type { ExampleClip } from "@/lib/site/example-videos";
import { PublicFrame } from "./public-frame";
import { VideoCard } from "./video-card";

export function VideoRail({
  title,
  clips,
}: {
  title: string;
  clips: ExampleClip[];
}) {
  return (
    <section>
      <PublicFrame className="flex items-end justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h2>
      </PublicFrame>
      <PublicFrame className="mt-5 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex snap-x snap-mandatory gap-4">
          {clips.map((clip) => (
            <VideoCard
              key={clip.id}
              src={clip.src}
              title={clip.title}
              subtitle={clip.subtitle}
              className="aspect-video w-[min(78vw,22rem)] shrink-0 snap-start sm:w-[24rem]"
            />
          ))}
        </div>
      </PublicFrame>
    </section>
  );
}
