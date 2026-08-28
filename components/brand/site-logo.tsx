import Image from "next/image";

export function SiteLogo({
  className,
  priority = false,
  size = "md",
}: {
  className?: string;
  priority?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const box =
    size === "lg" ? { width: 220, height: 107 } : size === "sm" ? { width: 140, height: 68 } : { width: 168, height: 82 };
  return (
    <Image
      src="/brand/logo-stacked.webp"
      alt="Production30"
      width={box.width}
      height={box.height}
      priority={priority}
      unoptimized
      className={className ?? "h-10 w-auto"}
    />
  );
}
