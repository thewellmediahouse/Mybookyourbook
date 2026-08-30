import Link from "next/link";

export function PromoBanner() {
  return (
    <div className="bg-accent px-5 py-2.5 text-center text-sm font-medium text-accent-foreground">
      30-second commercials, starring you.{" "}
      <Link href="/how-it-works" className="underline underline-offset-2">
        See how it works
      </Link>
    </div>
  );
}
