import Link from "next/link";
import { Book3D, type BookPose } from "@/components/book/Book3D";
import type { ShelfBook } from "@/lib/models/library";
import { cn } from "@/lib/utils";

interface ShelfProps {
  books: ShelfBook[];
  bookWidth?: number;
  pose?: BookPose;
  showTitles?: boolean;
  className?: string;
  priorityCount?: number;
}

export function Shelf({ books, bookWidth = 160, pose = "shelf", showTitles = true, className, priorityCount = 0 }: ShelfProps) {
  return (
    <div className={cn("relative", className)}>
      <ul className="flex flex-wrap items-end justify-center gap-x-8 gap-y-14 px-4 pb-1 sm:gap-x-12">
        {books.map((book, i) => (
          <li key={book.id} className="reveal flex flex-col items-center" style={{ "--i": i } as React.CSSProperties}>
            <Link href={`/book/${book.slug}`} className="group block outline-none" aria-label={book.title}>
              <Book3D title={book.title} coverUrl={book.cover_url} width={bookWidth} pose={pose} priority={i < priorityCount} />
              {showTitles && (
                <span className="mt-5 block max-w-[12rem] text-center font-display text-sm leading-snug text-foreground/85 transition-colors group-hover:text-lamp">
                  {book.title}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
      <div className="shelf-plank" aria-hidden="true" />
    </div>
  );
}
