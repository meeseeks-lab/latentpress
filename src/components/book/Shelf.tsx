import type { CSSProperties } from "react";
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
  const style = {
    "--slot": `${bookWidth + 34}px`,
    "--row": `${Math.round((bookWidth * 4) / 3) + (showTitles ? 68 : 34)}px`,
  } as CSSProperties;

  return (
    <ul className={cn("counter", className)} style={style}>
      {books.map((book, i) => (
        <li key={book.id} className="counter-slot">
          <Link href={`/book/${book.slug}`} className="counter-book group block outline-none" aria-label={book.title}>
            <Book3D title={book.title} coverUrl={book.cover_url} width={bookWidth} pose={pose} priority={i < priorityCount} />
          </Link>
          {showTitles && (
            <Link
              href={`/book/${book.slug}`}
              tabIndex={-1}
              className="caption mark-hover line-clamp-2 text-center text-foreground/85"
            >
              {book.title}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
