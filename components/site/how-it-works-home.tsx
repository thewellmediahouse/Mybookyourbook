import { HomeFrame } from "@/components/site/home-frame";
import { HOME_ICONS, HOME_STEPS, HOME_UI } from "@/lib/site/home";
import { StaticGraphic } from "@/components/site/static-graphic";

const TOPICS = [
  { id: "product", label: "Product", icon: HOME_ICONS.product, current: true },
  { id: "service", label: "Service", icon: HOME_ICONS.service, current: false },
  { id: "offer", label: "Offer", icon: HOME_ICONS.offer, current: false },
  { id: "pov", label: "POV", icon: HOME_ICONS.pov, current: false },
  { id: "storytime", label: "Storytime", icon: HOME_ICONS.storytime, current: false },
  { id: "before-after", label: "Before & After", icon: HOME_ICONS.beforeAfter, current: false },
] as const;

export function HowItWorksHome() {
  return (
    <section className="sales-light bg-[#F7F8FC] py-20 sm:py-24">
      <HomeFrame>
        <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-[#111A31] sm:text-4xl">
          From idea to video that sells.
        </h2>
        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {HOME_STEPS.map((step, index) => (
            <li key={step.number} className="relative">
              {index < HOME_STEPS.length - 1 ? (
                <span
                  className="pointer-events-none absolute top-5 left-[3.25rem] hidden h-px w-[calc(100%-1.5rem)] bg-[#2787FF]/35 md:block"
                  aria-hidden
                />
              ) : null}
              <p className="flex size-10 items-center justify-center rounded-full bg-[#2787FF] text-sm font-semibold text-[#001038]">
                {step.number}
              </p>
              <h3 className="mt-5 text-xl font-semibold tracking-tight text-[#111A31]">{step.title}</h3>
              <p className="mt-2 text-base leading-7 text-[#5A6480]">{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-14 hidden overflow-x-auto md:block">
          <StaticGraphic
            src={HOME_UI.studioToolbar}
            alt="Studio preview: Advert or Viral, topic chips, and 15, 20 or 30 second duration with 30 seconds selected"
            className="h-auto min-w-[46rem] w-full"
          />
        </div>
        <div className="mt-10 overflow-x-auto rounded-[1.5rem] border border-[#334D79] bg-[#0A162B] p-4 md:hidden">
          <div className="flex gap-2">
            <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#2787FF] bg-[#102648] px-3 text-sm text-[#F7F8FC]">
              <StaticGraphic src={HOME_ICONS.advert} alt="" width={16} height={16} />
              Advert
            </span>
            <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#314363] bg-[#111E34] px-3 text-sm text-[#F7F8FC]">
              <StaticGraphic src={HOME_ICONS.viral} alt="" width={16} height={16} />
              Viral
            </span>
          </div>
          <div className="mt-3 flex min-w-max gap-2">
            {TOPICS.map((topic) => (
              <span
                key={topic.id}
                className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm text-[#F7F8FC] ${
                  topic.current ? "border-[#2787FF] bg-[#0E2A51]" : "border-[#314363] bg-[#111E34]"
                }`}
              >
                <StaticGraphic src={topic.icon} alt="" width={16} height={16} />
                {topic.label}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm text-[#F7F8FC]">Duration</p>
          <div className="mt-2 flex gap-2">
            {["15s", "20s", "30s"].map((item) => (
              <span
                key={item}
                className={`inline-flex min-h-11 min-w-[4.5rem] items-center justify-center rounded-xl text-sm ${
                  item === "30s"
                    ? "bg-[#2787FF] font-semibold text-[#001038]"
                    : "border border-[#314363] bg-[#111E34] text-[#F7F8FC]"
                }`}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </HomeFrame>
    </section>
  );
}
