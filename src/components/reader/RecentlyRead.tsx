"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { ReadingPosition } from "@/lib/models/reader";
import { readRecent } from "@/lib/reading-storage";

export function RecentlyRead() {
  const [recent, setRecent] = useState<ReadingPosition[]>([]);

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  if (recent.length === 0) return null;

  return (
    <section aria-labelledby="recent-heading" className="container-lp pb-12">
      <div className="rounded-lg border border-border bg-raised/60 p-5 sm:p-6">
        <p className="eyebrow mb-1">Your bookmark</p>
        <h2 id="recent-heading" className="font-display text-xl">
          Pick up where you left off
        </h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recent.slice(0, 3).map((p) => {
            const pct = Math.round(((p.chapter - 1 + p.progress) / Math.max(1, p.totalChapters)) * 100);
            return (
              <li key={p.slug}>
                <Link
                  href={`/book/${p.slug}/chapter/${p.chapter}`}
                  className="group flex items-center gap-4 rounded-md p-2 transition-colors hover:bg-accent"
                >
                  <span className="h-16 w-12 shrink-0 overflow-hidden rounded-[2px] bg-muted shadow-md">
                    {p.coverUrl && <img src={p.coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-base group-hover:text-lamp">{p.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      Chapter {p.chapter} of {p.totalChapters} · {p.chapterTitle}
                    </span>
                    <span className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-muted">
                      <span className="block h-full bg-lamp" style={{ width: `${pct}%` }} />
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-lamp" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
