import { HomeFrame } from "@/components/site/home-frame";
import { HOME_BACKGROUNDS, HOME_STATS } from "@/lib/site/home";

export function VideoProofStats() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: `url(${HOME_BACKGROUNDS.lightFlow})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-[#F7F8FC]" aria-hidden />
      <HomeFrame className="relative">
        <p className="text-[11px] font-semibold tracking-[0.26em] text-[#2787FF]">{HOME_STATS.eyebrow}</p>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-[#111A31] sm:text-4xl">
          {HOME_STATS.heading}
        </h2>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {HOME_STATS.items.map((item) => (
            <li
              key={item.value}
              className="rounded-[1.6rem] border border-[#2787FF]/15 bg-white p-6 shadow-[0_18px_50px_rgba(17,26,49,0.08)] sm:p-8"
            >
              <p className="bg-gradient-to-r from-[#2787FF] to-[#A78BFF] bg-clip-text text-5xl font-semibold tracking-tight text-transparent sm:text-6xl">
                {item.value}
              </p>
              <p className="mt-3 text-base leading-7 text-[#5A6480]">{item.body}</p>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm leading-6 text-[#5A6480]">
          <a href={HOME_STATS.sourceHref} className="underline underline-offset-2" rel="noreferrer">
            {HOME_STATS.sourceLabel}
          </a>
        </p>
      </HomeFrame>
    </section>
  );
}
