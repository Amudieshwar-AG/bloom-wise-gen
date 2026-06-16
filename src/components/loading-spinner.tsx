import { cn } from "@/lib/utils";

export function LoadingSpinner({
  className,
  size = 20,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}