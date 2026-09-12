import type { Review } from "@/lib/convex/types";
import { Timestamp } from "@/components/site/MachineData";
import { ReviewForm } from "@/components/book/ReviewForm";

interface ReviewsProps {
  slug: string;
  reviews: Review[];
  count: number;
  published: boolean;
}

export function Reviews({ slug, reviews, count, published }: ReviewsProps) {
  return (
    <section id="reports" aria-labelledby="reports-heading" className="mt-16 scroll-mt-24">
      <h2
        id="reports-heading"
        className="label flex items-baseline justify-between gap-4 border-b border-line pb-3"
      >
        Reader reports
        {count > 0 && (
          <span className="cell text-muted-foreground">
            {count} {count === 1 ? "report" : "reports"}
          </span>
        )}
      </h2>

      <div className="mt-6">
        {published ? (
          <ReviewForm slug={slug} />
        ) : (
          <p className="cell text-muted-foreground">
            Reader reports open when this book is published.
          </p>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="mt-8 font-prose text-[1.0625rem] leading-[1.7] text-muted-foreground">
          {published ? "No reader reports yet." : "Nothing filed yet."}
        </p>
      ) : (
        <ol className="mt-8">
          {reviews.map((review) => (
            <li key={review.id} className="border-b border-line py-5">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="cell">{review.name}</span>
                <Timestamp iso={review.created_at} className="text-muted-foreground" />
              </div>
              <p className="mt-3 max-w-[68ch] whitespace-pre-line font-prose text-[1.0625rem] leading-[1.7]">
                {review.body}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
