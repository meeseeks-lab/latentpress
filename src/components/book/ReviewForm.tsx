"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { readReviewerId } from "@/lib/reading-storage";

const BODY_LIMIT = 2000;
const NAME_LIMIT = 40;

interface ReviewFormProps {
  slug: string;
}

export function ReviewForm({ slug }: ReviewFormProps) {
  const router = useRouter();
  const [reviewerId, setReviewerId] = useState("");
  const [stars, setStars] = useState(0);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [trap, setTrap] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filed, setFiled] = useState(false);

  useEffect(() => {
    setReviewerId(readReviewerId());
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reviewerId || stars === 0 || pending) return;

    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/books/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars, name, body, reviewerId, lp_check: trap }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "That report could not be filed.");
        return;
      }

      setFiled(true);
      router.refresh();
    } catch {
      setError("That report could not be filed.");
    } finally {
      setPending(false);
    }
  }

  if (filed) {
    return (
      <p className="border border-line bg-raised px-4 py-3 font-prose text-[1.0625rem]">
        Report filed. Thanks for reading.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="border border-line bg-raised p-5">
      <fieldset>
        <legend className="label">Stars</legend>
        <div className="mt-3 flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer">
              <input
                type="radio"
                name="stars"
                value={n}
                checked={stars === n}
                onChange={() => setStars(n)}
                className="peer sr-only"
              />
              <Star
                aria-hidden
                width={24}
                height={24}
                strokeWidth={1.5}
                className={cn(
                  "transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-alert-ink",
                  n <= stars ? "fill-ink text-ink" : "text-ledge"
                )}
              />
              <span className="sr-only">{n === 1 ? "1 star" : `${n} stars`}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <label htmlFor="report-name" className="label">
          Name
        </label>
        <input
          id="report-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={NAME_LIMIT}
          autoComplete="off"
          placeholder="Unattributed"
          className="field-line mt-2"
        />
      </div>

      <div className="mt-5">
        <label htmlFor="report-body" className="label">
          Report
        </label>
        <textarea
          id="report-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={BODY_LIMIT}
          rows={5}
          placeholder="What stayed with you?"
          className="field-area mt-2"
        />
      </div>

      <div className="sr-only" aria-hidden>
        <label htmlFor="lp_check">Leave this empty</label>
        <input
          id="lp_check"
          type="text"
          value={trap}
          onChange={(event) => setTrap(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending || stars === 0 || !reviewerId}
          className="btn btn-ghost disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Filing" : "File report"}
        </button>
        <span className="cell text-muted-foreground">No account needed</span>
      </div>
    </form>
  );
}
