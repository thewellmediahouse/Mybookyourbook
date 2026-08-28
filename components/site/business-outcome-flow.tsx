import { HomeFrame } from "@/components/site/home-frame";
import { HOME_BACKGROUNDS, HOME_ICONS, HOME_UI } from "@/lib/site/home";
import { StaticGraphic } from "@/components/site/static-graphic";

export function BusinessOutcomeFlow() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${HOME_BACKGROUNDS.performancePath})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-[#071225]/72" aria-hidden />
      <HomeFrame className="relative grid items-center gap-12 lg:grid-cols-2">
        <div>
          <h2 className="max-w-md text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Built around the numbers that matter.
          </h2>
          <StaticGraphic
            src={HOME_UI.conversionPath}
            alt="Attention, then enquiries, then customers, then sales"
            className="mt-8 w-full max-w-lg"
          />
          <ul className="sr-only">
            <li>
              <StaticGraphic src={HOME_ICONS.attention} alt="" /> Attention
            </li>
            <li>
              <StaticGraphic src={HOME_ICONS.enquiries} alt="" /> Enquiries
            </li>
            <li>
              <StaticGraphic src={HOME_ICONS.customers} alt="" /> Customers
            </li>
            <li>
              <StaticGraphic src={HOME_ICONS.sales} alt="" /> Sales
            </li>
          </ul>
          <p className="mt-6 max-w-md text-base leading-7 text-muted">
            Every script starts with your offer, your customer and the action you want them to take.
          </p>
        </div>
        <StaticGraphic
          src={HOME_UI.analyticsDashboard}
          alt="Ad performance overview with video views, website clicks, enquiries and sales trends. Decorative lines only; no customer figures."
          className="w-full"
        />
      </HomeFrame>
    </section>
  );
}
