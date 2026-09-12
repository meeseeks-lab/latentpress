"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Book3D } from "@/components/book/Book3D";
import type { ReadingPosition } from "@/lib/models/reader";
import { readRecent } from "@/lib/reading-storage";

export function RecentlyRead() {
  const [recent, setRecent] = useState<ReadingPosition[]>([]);

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  if (recent.length === 0) return null;

  return (
    <section aria-labelledby="recent-heading" className="container-lp pb-6 pt-10">
      <h2 id="recent-heading" className="label mb-4">
        Your bookmark
      </h2>
      <ul className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
        {recent.slice(0, 3).map((p) => {
          const pct = Math.round(((p.chapter - 1 + p.progress) / Math.max(1, p.totalChapters)) * 100);
          return (
            <li key={p.slug} className="border-t border-line">
              <Link href={`/book/${p.slug}/chapter/${p.chapter}`} className="group grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-4 py-4">
                <Book3D title={p.title} coverUrl={p.coverUrl} width={56} pose="flat" />
                <span className="min-w-0">
                  <span className="block truncate font-display text-lg uppercase leading-none transition-colors group-hover:text-ink-dim">
                    {p.title}
                  </span>
                  <span className="cell mt-2 block truncate uppercase">
                    Chapter {p.chapter} of {p.totalChapters} · {p.chapterTitle}
                  </span>
                  <span className="mt-2.5 block h-[2px] w-full bg-line">
                    <span className="block h-full bg-alert" style={{ width: `${pct}%` }} />
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-alert-ink" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
