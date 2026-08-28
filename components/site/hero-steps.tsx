import Link from "next/link";
import { HomeFrame } from "@/components/site/home-frame";
import { Button } from "@/components/ui/button";
import { HOME_IMAGES } from "@/lib/site/home";
import { StaticGraphic } from "@/components/site/static-graphic";

export function HeroSteps() {
  return (
    <section className="relative bg-[#071225]">
      <HomeFrame className="relative">
        <div className="relative overflow-visible pb-10 sm:pb-12">
          <StaticGraphic
            src={HOME_IMAGES.fromSelfieToSales}
            alt="From selfie to sales: record a 20-second selfie, upload your logo and product, build the advert, then launch in minutes. No editing skills needed."
            className="h-auto w-full"
          />
          <div
            className="pointer-events-none absolute right-0 bottom-10 h-[34%] w-[48%] bg-gradient-to-tl from-[#071225] from-10% via-[#071225]/85 to-transparent sm:bottom-12"
            aria-hidden
          />
          <div className="absolute right-3 bottom-2 sm:right-6 sm:bottom-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-gradient-to-r from-[#2787FF] to-[#A78BFF] px-7 text-[#001038] hover:from-[#3D9AFF] hover:to-[#B8A4FF]"
            >
              <Link href="/signup">
                Create my first advert
                <span aria-hidden>→</span>
              </Link>
            </Button>
          </div>
        </div>
      </HomeFrame>
    </section>
  );
}
