"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { readReviewerId, readBookRating, saveBookRating } from "@/lib/reading-storage";
import type { RatingSummary } from "@/lib/convex/types";

interface RatingWidgetProps {
  slug: string;
  rating: RatingSummary;
  published: boolean;
}

function summaryLabel({ average, count }: RatingSummary) {
  if (count === 0 || average === null) return "Not rated yet";
  return `${average.toFixed(1)} / 5 · ${count} ${count === 1 ? "rating" : "ratings"}`;
}

export function RatingWidget({ slug, rating, published }: RatingWidgetProps) {
  const [reviewerId, setReviewerId] = useState("");
  const [mine, setMine] = useState(0);
  const [hover, setHover] = useState(0);
  const [summary, setSummary] = useState(rating);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setReviewerId(readReviewerId());
    setMine(readBookRating(slug));
  }, [slug]);

  async function rate(stars: number) {
    if (!reviewerId || pending || stars === mine) return;

    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/books/${slug}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars, reviewerId }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.rating) {
        setError(data?.error ?? "That rating could not be saved.");
        return;
      }

      setMine(data.rating.stars);
      saveBookRating(slug, data.rating.stars);
      setSummary({ average: data.rating.average, count: data.rating.count });
    } catch {
      setError("That rating could not be saved.");
    } finally {
      setPending(false);
    }
  }

  const shown = hover || mine;

  return (
    <section id="rating" aria-labelledby="rating-heading" className="mt-16 scroll-mt-24">
      <h2
        id="rating-heading"
        className="label flex items-baseline justify-between gap-4 border-b border-line pb-3"
      >
        Reader rating
        <span className="cell text-muted-foreground">{summaryLabel(summary)}</span>
      </h2>

      {published ? (
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          <div
            role="radiogroup"
            aria-label="Rate this book"
            className="flex items-center gap-1.5"
            onMouseLeave={() => setHover(0)}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={mine === n}
                aria-label={n === 1 ? "1 star" : `${n} stars`}
                disabled={pending || !reviewerId}
                onMouseEnter={() => setHover(n)}
                onFocus={() => setHover(n)}
                onBlur={() => setHover(0)}
                onClick={() => rate(n)}
                className="cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alert-ink disabled:cursor-not-allowed"
              >
                <Star
                  aria-hidden
                  width={28}
                  height={28}
                  strokeWidth={1.5}
                  className={cn("transition-colors", n <= shown ? "fill-ink text-ink" : "text-ledge")}
                />
              </button>
            ))}
          </div>
          <span className="cell text-muted-foreground">
            {mine ? `You gave it ${mine} of 5. Tap a star to change it` : "Tap a star. No account needed"}
          </span>
        </div>
      ) : (
        <p className="cell mt-6 text-muted-foreground">Rating opens when this book is published.</p>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
