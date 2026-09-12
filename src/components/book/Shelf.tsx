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
    "--book-h": `${Math.round((bookWidth * 4) / 3)}px`,
    "--label": showTitles ? undefined : "2.25rem",
    gridTemplateColumns: `repeat(auto-fit, minmax(${bookWidth + 32}px, 1fr))`,
  } as CSSProperties;

  return (
    <ul className={cn("bookcase-shelves", className)} style={style}>
      {books.map((book, i) => (
        <li key={book.id} className="bookcase-slot reveal" style={{ "--i": i } as CSSProperties}>
          <Link href={`/book/${book.slug}`} className="group block outline-none" aria-label={book.title}>
            <Book3D title={book.title} coverUrl={book.cover_url} width={bookWidth} pose={pose} priority={i < priorityCount} />
          </Link>
          {showTitles && (
            <Link
              href={`/book/${book.slug}`}
              tabIndex={-1}
              className="bookcase-label line-clamp-2 text-center font-display text-sm leading-snug text-foreground/85 transition-colors hover:text-lamp"
            >
              {book.title}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
