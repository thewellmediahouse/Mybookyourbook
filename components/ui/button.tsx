"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { useState, type ButtonHTMLAttributes, type MouseEvent } from "react";
import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 min-h-11 px-4",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-foreground hover:bg-accent-hover",
        outline: "border border-border bg-transparent text-foreground hover:bg-surface",
        ghost: "text-foreground hover:bg-surface",
      },
      size: {
        default: "h-11",
        sm: "h-9 px-3",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  busy?: boolean;
}

function isThenable(value: unknown): value is Promise<unknown> {
  return typeof value === "object" && value !== null && "then" in value;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  busy = false,
  disabled,
  children,
  type,
  onClick,
  ...props
}: ButtonProps) {
  const form = useFormStatus();
  const [clickBusy, setClickBusy] = useState(false);
  const submitting = type !== "button" && type !== "reset" && form.pending;
  const isBusy = Boolean(busy || clickBusy || submitting);

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    const result = onClick?.(event);
    if (!isThenable(result)) {
      return;
    }
    setClickBusy(true);
    try {
      await result;
    } finally {
      setClickBusy(false);
    }
  }

  if (asChild) {
    return (
      <Slot className={cn(buttonVariants({ variant, size, className }))} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button
      {...props}
      type={type}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || isBusy}
      aria-busy={isBusy || undefined}
      onClick={handleClick}
    >
      {isBusy ? <Spinner className="size-4" /> : null}
      {children}
    </button>
  );
}

export { Button, buttonVariants };
