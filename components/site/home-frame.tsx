import type { ReactNode } from "react";
import { PublicFrame } from "@/components/site/public-frame";
import { cn } from "@/lib/utils";

export function HomeFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <PublicFrame className={cn("max-w-[80rem]", className)}>{children}</PublicFrame>;
}
