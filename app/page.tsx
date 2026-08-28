import { BusinessOutcomeFlow } from "@/components/site/business-outcome-flow";
import { CreationChoices } from "@/components/site/creation-choices";
import { FinalSalesCta } from "@/components/site/final-sales-cta";
import { HeroSteps } from "@/components/site/hero-steps";
import { HowItWorksHome } from "@/components/site/how-it-works-home";
import { PublicShell } from "@/components/site/public-shell";
import { SalesHero } from "@/components/site/sales-hero";
import { StickyHomeCta } from "@/components/site/sticky-home-cta";
import { StyleCarousel } from "@/components/site/style-carousel";
import { VideoProofStats } from "@/components/site/video-proof-stats";

export default function Home() {
  return (
    <PublicShell>
      <main className="flex flex-col pb-24 md:pb-0">
        <SalesHero />
        <HeroSteps />
        <VideoProofStats />
        <CreationChoices />
        <BusinessOutcomeFlow />
        <HowItWorksHome />
        <StyleCarousel />
        <FinalSalesCta />
      </main>
      <StickyHomeCta />
    </PublicShell>
  );
}
