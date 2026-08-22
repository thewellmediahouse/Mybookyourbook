import { useId } from "react";
import { cn } from "@/lib/utils";

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  const id = `p30-spinner-${useId().replace(/:/g, "")}`;
  return (
    <span role="status" className={cn("inline-flex items-center justify-center", className)}>
      <svg viewBox="0 0 24 24" className="p30-spinner size-full" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1678FF" />
            <stop offset="100%" stopColor="#5A45FC" />
          </linearGradient>
        </defs>
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke="currentColor"
          className="text-border"
          strokeWidth="2.4"
        />
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray="36 22"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function LoadingScreen({ message = "Loading" }: { message?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-5 bg-background px-6">
      <SiteMark />
      <Spinner className="size-10" label={message} />
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}

function SiteMark() {
  return (
    <svg viewBox="0 0 48 32" className="h-8 w-12" aria-hidden="true">
      <defs>
        <linearGradient id="p30-load-mark" x1="0" y1="0" x2="48" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1678FF" />
          <stop offset="1" stopColor="#5A45FC" />
        </linearGradient>
      </defs>
      <g fill="url(#p30-load-mark)">
        <rect x="0" y="8" width="7" height="2" rx="1" />
        <rect x="0" y="15" width="9" height="2" rx="1" />
        <rect x="0" y="22" width="7" height="2" rx="1" />
      </g>
      <circle cx="28" cy="16" r="10" fill="#001038" />
      <polygon points="24.8,11.4 24.8,20.6 33.2,16" fill="url(#p30-load-mark)" />
    </svg>
  );
}
