import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  average: number | null;
  count: number;
  size?: number;
  showCount?: boolean;
  className?: string;
}

// Renders nothing for an unrated book, so callers can drop it in unconditionally.
export function RatingStars({ average, count, size = 11, showCount = true, className }: RatingStarsProps) {
  if (average === null || count === 0) return null;
  const filled = Math.round(average);
  return (
    <span
      role="img"
      aria-label={`Rated ${average.toFixed(1)} out of 5 by ${count} ${count === 1 ? "reader" : "readers"}`}
      className={cn("inline-flex items-center gap-1.5", className)}
    >
      <span className="inline-flex items-center gap-px">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            aria-hidden
            width={size}
            height={size}
            strokeWidth={1.5}
            className={n <= filled ? "fill-current" : "opacity-40"}
          />
        ))}
      </span>
      {showCount && (
        <span className="cell" aria-hidden>
          {average.toFixed(1)} ({count})
        </span>
      )}
    </span>
  );
}
