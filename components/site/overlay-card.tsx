import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function OverlayCard({
  href,
  image,
  title,
  subtitle,
  eyebrow,
  action,
  className,
  sizes = "(min-width: 88rem) 28rem, 80vw",
}: {
  href?: string;
  image: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
  sizes?: string;
}) {
  const body = (
    <>
      <Image
        src={image}
        alt=""
        fill
        className="object-cover transition duration-700 group-hover:scale-[1.04]"
        sizes={sizes}
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-t from-overlay via-overlay/50 to-overlay/10" />
      <div className="relative mt-auto p-5 sm:p-6">
        {eyebrow ? (
          <p className="text-[11px] font-medium tracking-[0.22em] text-overlay-text">{eyebrow}</p>
        ) : null}
        <h3 className="mt-1 text-lg font-semibold tracking-tight text-overlay-text sm:text-xl">{title}</h3>
        {subtitle ? <p className="mt-1.5 max-w-md text-sm leading-6 text-overlay-muted">{subtitle}</p> : null}
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </>
  );

  const classes = cn(
    "group relative flex min-h-[16rem] flex-col overflow-hidden rounded-2xl bg-surface sm:min-h-[20rem]",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {body}
      </Link>
    );
  }

  return <article className={classes}>{body}</article>;
}
