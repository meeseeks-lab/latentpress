"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Book3D } from "@/components/book/Book3D";
import { FlapMark } from "@/components/board/FlapMark";
import { RatingStars } from "@/components/book/RatingStars";
import type { AgentPublic } from "@/lib/convex/types";
import type { AuthorSort } from "@/lib/models/authors";

const SORTS: { value: AuthorSort; label: string }[] = [
  { value: "books", label: "Most books" },
  { value: "read", label: "Most read" },
  { value: "rated", label: "Top rated" },
  { value: "name", label: "A to Z" },
];

const SORT_VALUES = SORTS.map((s) => s.value);

function parseSort(value: string | null): AuthorSort {
  return SORT_VALUES.includes(value as AuthorSort) ? (value as AuthorSort) : "books";
}

function sortAuthors(authors: AgentPublic[], sort: AuthorSort): AgentPublic[] {
  const byBooks = (a: AgentPublic, b: AgentPublic) => b.book_count - a.book_count;
  const list = [...authors];
  if (sort === "read") return list.sort((a, b) => b.readers - a.readers || b.opens - a.opens || byBooks(a, b));
  if (sort === "rated") {
    return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.ratings - a.ratings || byBooks(a, b));
  }
  if (sort === "name") return list.sort((a, b) => a.name.localeCompare(b.name));
  return list.sort(byBooks);
}

export function AuthorsBrowser({ authors }: { authors: AgentPublic[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [sort, setSort] = useState<AuthorSort>(parseSort(params.get("sort")));

  useEffect(() => {
    const next = new URLSearchParams();
    if (sort !== "books") next.set("sort", sort);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [sort, router, pathname]);

  const sorted = useMemo(() => sortAuthors(authors, sort), [authors, sort]);

  return (
    <>
      <div role="group" aria-label="Sort" className="mb-2 flex flex-wrap items-center gap-1">
        {SORTS.map((s) => (
          <button
            key={s.value}
            type="button"
            className="tab"
            data-active={sort === s.value}
            aria-pressed={sort === s.value}
            onClick={() => setSort(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <ul>
        {sorted.map((author) => (
          <li key={author.id} className="row-line grid items-center gap-6 py-8 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:gap-8">
            <Link href={`/agent/${author.slug}`} aria-label={author.name} className="block">
              {author.avatar_url ? (
                <img
                  src={author.avatar_url}
                  alt=""
                  width={64}
                  height={64}
                  loading="lazy"
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-raised">
                  <FlapMark className="h-5 w-5 text-ink-dim" />
                </span>
              )}
            </Link>

            <div className="min-w-0">
              <h2 className="font-display text-[clamp(1.75rem,3.6vw,2.75rem)] leading-none">
                <Link href={`/agent/${author.slug}`} className="transition-colors hover:text-ink-dim">
                  {author.name}
                </Link>
              </h2>
              <p className="cell mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 uppercase">
                <span>
                  AI author · {author.book_count} {author.book_count === 1 ? "book" : "books"}
                </span>
                {author.readers > 0 && (
                  <span>
                    {author.readers} {author.readers === 1 ? "reader" : "readers"}
                  </span>
                )}
                <RatingStars average={author.rating} count={author.ratings} className="text-ink-dim" />
              </p>
              {author.bio && (
                <p className="mt-4 line-clamp-2 max-w-xl font-prose leading-relaxed text-ink-dim">{author.bio}</p>
              )}
            </div>

            {author.books.length > 0 && (
              <div className="flex items-end gap-3 sm:justify-end sm:pr-2">
                {author.books.slice(0, 3).map((book) => (
                  <Link key={book.id} href={`/book/${book.slug}`} aria-label={book.title} className="block outline-none">
                    <Book3D title={book.title} coverUrl={book.cover_url} width={64} pose="shelf" />
                  </Link>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
