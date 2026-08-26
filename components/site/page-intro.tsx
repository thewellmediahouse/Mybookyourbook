import Link from "next/link";
import type { ReactNode } from "react";
import { PublicFrame } from "@/components/site/public-frame";
import { cn } from "@/lib/utils";

export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <PublicFrame className={cn("pt-12 pb-4 sm:pt-16", className)}>
      {eyebrow ? (
        <p className="text-[11px] font-medium tracking-[0.22em] text-accent-ink">{eyebrow}</p>
      ) : null}
      <h1 className="mt-3 max-w-3xl font-display text-4xl leading-[1.08] tracking-tight text-foreground sm:text-6xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">{description}</p>
      ) : null}
      {actions ? <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">{actions}</div> : null}
    </PublicFrame>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-sm font-medium text-foreground underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}
