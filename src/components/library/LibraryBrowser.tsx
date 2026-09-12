"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Dices, LayoutList, Library as LibraryIcon, Search, X } from "lucide-react";
import { Book3D } from "@/components/book/Book3D";
import type { LibraryFilters, LibrarySort, LibraryView, ShelfBook } from "@/lib/models/library";
import { useBatchedList } from "@/lib/hooks/use-batched-list";
import { cn } from "@/lib/utils";

interface LibraryBrowserProps {
  books: ShelfBook[];
}

const SORTS: { value: LibrarySort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "updated", label: "Recently written" },
  { value: "read", label: "Most read" },
  { value: "oldest", label: "Oldest" },
  { value: "title", label: "A to Z" },
];

const SORT_VALUES = SORTS.map((s) => s.value);
const VIEW_VALUES: LibraryView[] = ["shelf", "board"];

function parseSort(value: string | null): LibrarySort {
  return SORT_VALUES.includes(value as LibrarySort) ? (value as LibrarySort) : "newest";
}

function parseView(value: string | null): LibraryView {
  return VIEW_VALUES.includes(value as LibraryView) ? (value as LibraryView) : "shelf";
}

function languageLabel(tag: string): string {
  try {
    const display = new Intl.DisplayNames(["en"], { type: "language" });
    return display.of(tag) ?? tag;
  } catch {
    return tag;
  }
}

function stamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--------";
  return d.toISOString().slice(0, 10);
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
  if (filters.sort === "updated") return filtered.sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
  if (filters.sort === "oldest") return filtered.sort((a, b) => byDate(b, a));
  if (filters.sort === "read") {
    return filtered.sort(
      (a, b) => (b.readers ?? 0) - (a.readers ?? 0) || (b.opens ?? 0) - (a.opens ?? 0) || byDate(a, b),
    );
  }
  return filtered.sort((a, b) => a.title.localeCompare(b.title));
}

export function LibraryBrowser({ books }: LibraryBrowserProps) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<LibraryFilters>({
    query: params.get("q") ?? "",
    genre: params.get("genre"),
    language: params.get("lang"),
    sort: parseSort(params.get("sort")),
    view: parseView(params.get("view")),
  });
  const [picked, setPicked] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const next = new URLSearchParams();
    if (filters.query) next.set("q", filters.query);
    if (filters.genre) next.set("genre", filters.genre);
    if (filters.language) next.set("lang", filters.language);
    if (filters.sort !== "newest") next.set("sort", filters.sort);
    if (filters.view !== "shelf") next.set("view", filters.view);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [filters.query, filters.genre, filters.language, filters.sort, filters.view, router, pathname]);

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
      <div className="flex flex-col gap-4 border-t border-line pt-6 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="Search titles, blurbs, genres"
            aria-label="Search the library"
            className="field"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={surprise} className="tab" disabled={visible.length === 0}>
            <Dices className="h-3.5 w-3.5" />
            Surprise me
          </button>
          <div role="group" aria-label="Sort" className="flex flex-wrap items-center gap-1">
            {SORTS.map((s) => (
              <button
                key={s.value}
                type="button"
                className="tab"
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
            <ViewButton view="board" current={filters.view} onSelect={(view) => set({ view })} />
          </div>
        </div>
      </div>

      {genres.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2" role="group" aria-label="Genre">
          <button type="button" className="tab" data-active={filters.genre === null} aria-pressed={filters.genre === null} onClick={() => set({ genre: null })}>
            All shelves
          </button>
          {genres.map((g) => (
            <button
              key={g}
              type="button"
              className="tab"
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
        <div className="mt-2 flex flex-wrap items-center gap-2" role="group" aria-label="Language">
          <button type="button" className="tab" data-active={filters.language === null} aria-pressed={filters.language === null} onClick={() => set({ language: null })}>
            All languages
          </button>
          {languages.map((l) => (
            <button
              key={l}
              type="button"
              className="tab"
              data-active={filters.language === l}
              aria-pressed={filters.language === l}
              onClick={() => set({ language: filters.language === l ? null : l })}
            >
              {languageLabel(l)}
            </button>
          ))}
        </div>
      )}

      <p className="cell mt-7 flex flex-wrap items-center gap-3 uppercase" aria-live="polite">
        <span>
          {visible.length === books.length
            ? `${books.length} ${books.length === 1 ? "book" : "books"} on the shelves`
            : `${visible.length} of ${books.length} books`}
        </span>
        {!cleared && (
          <button type="button" onClick={() => set({ query: "", genre: null, language: null })} className="text-ink underline decoration-alert-ink decoration-2 underline-offset-4">
            <span className="inline-flex items-center gap-1">
              <X className="h-3 w-3" /> Clear
            </span>
          </button>
        )}
      </p>

      {visible.length === 0 ? (
        <div className="notice mt-8">
          <p className="font-display text-2xl uppercase">Nothing on this shelf</p>
          <p className="mt-2 text-sm text-muted-foreground">Try another genre, or clear the search.</p>
        </div>
      ) : filters.view === "shelf" ? (
        <ShelfView books={shown} picked={picked} listRef={listRef} />
      ) : (
        <BoardView books={shown} picked={picked} listRef={listRef} />
      )}

      {hasMore && (
        <div ref={sentinelRef} className="mt-12 flex justify-center">
          <button type="button" onClick={showMore} className="tab">
            Show more books
          </button>
        </div>
      )}
    </div>
  );
}

function ViewButton({ view, current, onSelect }: { view: LibraryView; current: LibraryView; onSelect: (v: LibraryView) => void }) {
  const Icon = view === "shelf" ? LibraryIcon : LayoutList;
  return (
    <button
      type="button"
      className="tab w-9 justify-center px-0"
      data-active={current === view}
      aria-pressed={current === view}
      aria-label={view === "shelf" ? "Shelf view" : "Board view"}
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
    <ul ref={listRef} className="counter mt-8" style={{ "--slot": "10.5rem", "--row": "16.5rem" } as CSSProperties}>
      {books.map((book) => (
        <li key={book.id} data-book-id={book.id} className="counter-slot">
          {picked === book.id && <span className="label bg-alert px-2 py-1 text-on-alert">Try this one</span>}
          <Link href={`/book/${book.slug}`} className="counter-book group block outline-none" aria-label={book.title}>
            <Book3D
              title={book.title}
              coverUrl={book.cover_url}
              width={150}
              pose="shelf"
              className={cn(picked === book.id && "[&_.book3d]:[--lift:-9px] [&_.book3d]:[--ry:-5deg]")}
            />
          </Link>
          <Link
            href={`/book/${book.slug}`}
            tabIndex={-1}
            className="caption mark-hover line-clamp-2 text-center text-foreground/85"
          >
            {book.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function BoardView({ books, picked, listRef }: ViewProps) {
  return (
    <div className="board mt-8 p-4 sm:p-6" data-room="board">
      <div className="row-line row-head row-index" aria-hidden="true">
        <span className="label">Written</span>
        <span className="label">Book</span>
        <span className="label hidden sm:block">Genre</span>
        <span className="label hidden sm:block">Filed</span>
      </div>
      <ul ref={listRef}>
        {books.map((book) => (
          <li key={book.id} data-book-id={book.id}>
            <Link href={`/book/${book.slug}`} className="row-line row-index group" data-picked={picked === book.id}>
              <span className="cell">{stamp(book.updated_at)}</span>
              <span className="min-w-0">
                <span className="block truncate font-ui text-[1.05rem] font-semibold leading-tight text-foreground transition-colors group-hover:text-alert-ink">
                  {book.title}
                </span>
                <span className="mt-0.5 block truncate text-[0.75rem] text-muted-foreground sm:hidden">
                  {book.genre.slice(0, 2).join(", ") || "—"}
                </span>
              </span>
              <span className="hidden truncate text-sm text-muted-foreground sm:block">
                {book.genre.slice(0, 3).join(", ") || "—"}
              </span>
              <span className="cell hidden sm:block">{stamp(book.created_at)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
