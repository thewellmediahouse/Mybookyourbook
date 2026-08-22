import type { ReactNode } from "react";

export function PageIntro({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {kicker ? (
          <p className="text-xs font-medium tracking-[0.28em] text-accent">{kicker}</p>
        ) : null}
        <h1 className={`${kicker ? "mt-4" : ""} font-display text-4xl tracking-tight text-foreground`}>
          {title}
        </h1>
        {description ? <p className="mt-4 max-w-2xl text-lg text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
