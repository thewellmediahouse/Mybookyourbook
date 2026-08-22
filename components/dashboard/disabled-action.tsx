import { Button } from "@/components/ui/button";

export function DisabledAction({
  label,
  reason,
  className,
}: {
  label: string;
  reason: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Button type="button" disabled>
        {label}
      </Button>
      <p className="mt-2 max-w-md text-sm text-muted">{reason}</p>
    </div>
  );
}
