import Image from "next/image";
import Link from "next/link";
import { HomeFrame } from "@/components/site/home-frame";
import { Button } from "@/components/ui/button";
import { HOME_BACKGROUNDS, HOME_CHOICES } from "@/lib/site/home";
import { cn } from "@/lib/utils";

export function CreationChoices() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-35"
        style={{ backgroundImage: `url(${HOME_BACKGROUNDS.lightFlow})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-[#F7F8FC]" aria-hidden />
      <HomeFrame className="relative grid gap-5 lg:grid-cols-2">
        {HOME_CHOICES.map((choice) => (
          <article key={choice.id} className="relative min-h-[22rem] overflow-hidden rounded-[1.75rem] sm:min-h-[26rem]">
            <Image
              src={choice.image}
              alt={
                choice.id === "viral"
                  ? "A person recording a casual social video at home"
                  : "A product bottle in a studio, ready for a sales advert"
              }
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              style={{ objectPosition: choice.objectPosition }}
            />
            <div
              className={cn(
                "absolute inset-0",
                choice.id === "viral"
                  ? "bg-gradient-to-r from-[#071225]/88 via-[#0B1730]/55 to-[#7657FF]/35"
                  : "bg-gradient-to-r from-[#071225]/88 via-[#071225]/45 to-transparent",
              )}
            />
            <div className="relative flex h-full min-h-[22rem] flex-col justify-end p-6 sm:min-h-[26rem] sm:p-10">
              <h2 className="text-3xl font-semibold tracking-tight text-[#F7F8FC] sm:text-4xl">{choice.title}</h2>
              <p className="mt-3 max-w-md text-base leading-7 text-[#F7F8FC]/90">{choice.body}</p>
              <div className="mt-6">
                <Button
                  asChild
                  size="lg"
                  className={cn(
                    "rounded-full px-6",
                    choice.id === "viral" ? "bg-[#B8A4FF] text-[#001038] hover:bg-[#C4B5FD]" : undefined,
                  )}
                >
                  <Link href={choice.href}>{choice.cta}</Link>
                </Button>
              </div>
            </div>
          </article>
        ))}
      </HomeFrame>
    </section>
  );
}
