"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import { Dices, LayoutGrid, Library as LibraryIcon, Search, X } from "lucide-react";
import { Book3D } from "@/components/book/Book3D";
import type { LibraryFilters, LibrarySort, LibraryView, ShelfBook } from "@/lib/models/library";
import { useBatchedList } from "@/lib/hooks/use-batched-list";
import { cn } from "@/lib/utils";

interface LibraryBrowserProps {
  books: ShelfBook[];
}

const SORTS: { value: LibrarySort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "updated", label: "Recently updated" },
  { value: "oldest", label: "Oldest" },
  { value: "title", label: "A to Z" },
];

// "zh-CN" -> "Chinese (China)" using the browser's own locale data, so we don't
// ship and maintain a language-name table.
function languageLabel(tag: string): string {
  try {
    const display = new Intl.DisplayNames(["en"], { type: "language" });
    return display.of(tag) ?? tag;
  } catch {
    return tag;
  }
}

function applyFilters(books: ShelfBook[], filters: LibraryFilters): ShelfBook[] {
  const q = filters.query.trim().toLowerCase();
  const filtered = books.filter((b) => {
    if (filters.genre && !b.genre.includes(filters.genre)) return false;
    if (filters.language && b.language !== filters.language) return false;
    if (!q) return true;
    return (
      b.title.toLowerCase().includes(q) ||
      (b.blurb ?? "").toLowerCase().includes(q) ||
      b.genre.some((g) => g.toLowerCase().includes(q))
    );
  });
  const byDate = (a: ShelfBook, b: ShelfBook) => Date.parse(b.created_at) - Date.parse(a.created_at);
  if (filters.sort === "newest") return filtered.sort(byDate);
  if (filters.sort === "updated")
    return filtered.sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
  if (filters.sort === "oldest") return filtered.sort((a, b) => byDate(b, a));
  return filtered.sort((a, b) => a.title.localeCompare(b.title));
}

export function LibraryBrowser({ books }: LibraryBrowserProps) {
  const params = useSearchParams();
  const [filters, setFilters] = useState<LibraryFilters>({
    query: params.get("q") ?? "",
    genre: params.get("genre"),
    language: params.get("lang"),
    sort: "newest",
    view: "shelf",
  });
  const [picked, setPicked] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const genres = useMemo(() => {
    const counts = new Map<string, number>();
    books.forEach((b) => b.genre.forEach((g) => counts.set(g, (counts.get(g) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([g]) => g);
  }, [books]);

  const languages = useMemo(() => {
    const counts = new Map<string, number>();
    books.forEach((b) => counts.set(b.language, (counts.get(b.language) ?? 0) + 1));
    return counts.size > 1 ? [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([l]) => l) : [];
  }, [books]);

  const visible = useMemo(() => applyFilters([...books], filters), [books, filters]);
  const { visible: shown, hasMore, showMore, revealUpTo, sentinelRef } = useBatchedList(visible);

  const set = (patch: Partial<LibraryFilters>) => setFilters((f) => ({ ...f, ...patch }));

  const surprise = () => {
    if (visible.length === 0) return;
    const pool = visible.length > 1 ? visible.filter((b) => b.id !== picked) : visible;
    const choice = pool[Math.floor(Math.random() * pool.length)];
    setPicked(choice.id);
    // The pick can sit past the rendered batch, so reveal it before scrolling.
    revealUpTo(visible.findIndex((b) => b.id === choice.id));
    requestAnimationFrame(() => {
      const el = listRef.current?.querySelector<HTMLElement>(`[data-book-id="${choice.id}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.querySelector<HTMLAnchorElement>("a")?.focus({ preventScroll: true });
    });
  };

  const cleared = !filters.query && !filters.genre && !filters.language;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="Search titles, blurbs, genres"
            aria-label="Search the library"
            className="h-11 w-full rounded-md border border-border bg-raised pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-lamp"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={surprise} className="chip h-9" disabled={visible.length === 0}>
            <Dices className="h-3.5 w-3.5" />
            Surprise me
          </button>
          <div role="group" aria-label="Sort" className="flex items-center gap-1">
            {SORTS.map((s) => (
              <button
                key={s.value}
                type="button"
                className="chip h-9"
                data-active={filters.sort === s.value}
                aria-pressed={filters.sort === s.value}
                onClick={() => set({ sort: s.value })}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div role="group" aria-label="View" className="flex items-center gap-1">
            <ViewButton view="shelf" current={filters.view} onSelect={(view) => set({ view })} />
            <ViewButton view="grid" current={filters.view} onSelect={(view) => set({ view })} />
          </div>
        </div>
      </div>

      {genres.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2" role="group" aria-label="Genre">
          <button type="button" className="chip" data-active={filters.genre === null} aria-pressed={filters.genre === null} onClick={() => set({ genre: null })}>
            All shelves
          </button>
          {genres.map((g) => (
            <button
              key={g}
              type="button"
              className="chip"
              data-active={filters.genre === g}
              aria-pressed={filters.genre === g}
              onClick={() => set({ genre: filters.genre === g ? null : g })}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {languages.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Language">
          <button type="button" className="chip" data-active={filters.language === null} onClick={() => set({ language: null })}>
            All languages
          </button>
          {languages.map((l) => (
            <button
              key={l}
              type="button"
              className="chip"
              data-active={filters.language === l}
              aria-pressed={filters.language === l}
              onClick={() => set({ language: filters.language === l ? null : l })}
            >
              {languageLabel(l)}
            </button>
          ))}
        </div>
      )}

      <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.14em] text-signal-dim" aria-live="polite">
        {visible.length === books.length
          ? `${books.length} ${books.length === 1 ? "book" : "books"} on the shelves`
          : `${visible.length} of ${books.length} books`}
        {!cleared && (
          <button
            type="button"
            onClick={() => set({ query: "", genre: null, language: null })}
            className="ml-3 inline-flex items-center gap-1 text-lamp hover:underline"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </p>

      {visible.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-border px-6 py-20 text-center">
          <p className="font-display text-2xl">Nothing on this shelf</p>
          <p className="mt-2 text-sm text-muted-foreground">Try another genre, or clear the search.</p>
        </div>
      ) : filters.view === "shelf" ? (
        <ShelfView books={shown} picked={picked} listRef={listRef} />
      ) : (
        <GridView books={shown} picked={picked} listRef={listRef} />
      )}

      {hasMore && (
        <div ref={sentinelRef} className="mt-12 flex justify-center">
          <button type="button" onClick={showMore} className="chip h-9">
            Show more books
          </button>
        </div>
      )}
    </div>
  );
}

function ViewButton({ view, current, onSelect }: { view: LibraryView; current: LibraryView; onSelect: (v: LibraryView) => void }) {
  const Icon = view === "shelf" ? LibraryIcon : LayoutGrid;
  return (
    <button
      type="button"
      className="chip h-9 w-9 justify-center px-0"
      data-active={current === view}
      aria-pressed={current === view}
      aria-label={view === "shelf" ? "Shelf view" : "Grid view"}
      onClick={() => onSelect(view)}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

interface ViewProps {
  books: ShelfBook[];
  picked: string | null;
  listRef: React.RefObject<HTMLUListElement | null>;
}

function ShelfView({ books, picked, listRef }: ViewProps) {
  return (
    <div className="bookcase scanlines mt-10">
      <ul ref={listRef} className="bookcase-shelves">
        {books.map((book, i) => (
          <li key={book.id} data-book-id={book.id} className="bookcase-slot reveal" style={{ "--i": Math.min(i, 12) } as CSSProperties}>
            {picked === book.id && (
              <span className="mb-3 rounded-full bg-lamp px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-lamp-ink">
                Try this one
              </span>
            )}
            <Link href={`/book/${book.slug}`} className="group block outline-none" aria-label={book.title}>
              <Book3D title={book.title} coverUrl={book.cover_url} width={150} pose="shelf" className={cn(picked === book.id && "[&_.book3d]:[--lift:-14px] [&_.book3d]:[--ry:-6deg]")} />
            </Link>
            <Link href={`/book/${book.slug}`} tabIndex={-1} className="bookcase-label line-clamp-2 text-center font-display text-sm leading-snug text-foreground/85 hover:text-lamp">
              {book.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GridView({ books, picked, listRef }: ViewProps) {
  return (
    <ul ref={listRef} className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {books.map((book, i) => (
        <li key={book.id} data-book-id={book.id} className="reveal" style={{ "--i": Math.min(i, 12) } as CSSProperties}>
          <Link
            href={`/book/${book.slug}`}
            className={cn(
              "group grid grid-cols-[7rem_1fr] gap-5 rounded-lg p-3 transition-colors hover:bg-raised",
              picked === book.id && "bg-raised ring-1 ring-lamp",
            )}
          >
            <Book3D title={book.title} coverUrl={book.cover_url} width={100} pose="flat" />
            <span className="min-w-0">
              <span className="block font-display text-xl leading-tight group-hover:text-lamp">{book.title}</span>
              {book.blurb && <span className="mt-2 line-clamp-4 block font-prose text-sm leading-relaxed text-muted-foreground">{book.blurb}</span>}
              {book.genre.length > 0 && (
                <span className="mt-3 flex flex-wrap gap-1.5">
                  {book.genre.slice(0, 3).map((g) => (
                    <span key={g} className="chip py-1 text-[11px]">
                      {g}
                    </span>
                  ))}
                </span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
