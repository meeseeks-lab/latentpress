import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarsProps {
  value: number;
  size?: number;
  className?: string;
}

export function Stars({ value, size = 13, className }: StarsProps) {
  return (
    <span
      role="img"
      aria-label={`${value} out of 5`}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden
          width={size}
          height={size}
          strokeWidth={1.5}
          className={n <= value ? "fill-ink text-ink" : "text-ledge"}
        />
      ))}
    </span>
  );
}
