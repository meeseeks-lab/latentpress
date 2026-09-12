"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, List, Moon, Sun, Type } from "lucide-react";
import type { ProseSize, ReaderPrefs, ReadingPosition } from "@/lib/models/reader";
import { readPrefs, savePosition, savePrefs } from "@/lib/reading-storage";
import { cn } from "@/lib/utils";

interface ReaderShellProps {
  book: { slug: string; title: string; coverUrl: string | null };
  chapter: { number: number; title: string };
  chapters: { number: number; title: string }[];
  totalChapters: number;
  prevHref: string | null;
  nextHref: string | null;
  children: ReactNode;
}

const SIZES: ProseSize[] = ["sm", "md", "lg"];
const SIZE_LABELS: Record<ProseSize, string> = { sm: "small", md: "medium", lg: "large" };

export function ReaderShell({ book, chapter, chapters, totalChapters, prevHref, nextHref, children }: ReaderShellProps) {
  const router = useRouter();
  const [prefs, setPrefs] = useState<ReaderPrefs>({ size: "md", room: "paper" });
  const [progress, setProgress] = useState(0);
  const tocRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    setPrefs(readPrefs());
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (prefs.room === "board") root.setAttribute("data-room", "board");
    else root.removeAttribute("data-room");
  }, [prefs.room]);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 1);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const position: ReadingPosition = {
      slug: book.slug,
      title: book.title,
      coverUrl: book.coverUrl,
      chapter: chapter.number,
      chapterTitle: chapter.title,
      totalChapters,
      progress,
      updatedAt: Date.now(),
    };
    if (chapter.number === 1 && progress === 0) return;
    const id = window.setTimeout(() => savePosition(position), 400);
    return () => window.clearTimeout(id);
  }, [book, chapter, totalChapters, progress]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "AUDIO"].includes(target.tagName)) return;
      if (e.key === "ArrowRight" && nextHref) router.push(nextHref);
      if (e.key === "ArrowLeft" && prevHref) router.push(prevHref);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, nextHref, prevHref]);

  const update = (next: Partial<ReaderPrefs>) => {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    savePrefs(merged);
  };

  const cycleSize = () => {
    const idx = SIZES.indexOf(prefs.size);
    update({ size: SIZES[(idx + 1) % SIZES.length] });
  };

  const goToChapter = (number: number) => {
    tocRef.current?.removeAttribute("open");
    router.push(`/book/${book.slug}/chapter/${number}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* The room is an attribute on <html>, set before first paint so a reader who
          chose the board never sees a flash of paper. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{var p=JSON.parse(localStorage.getItem('lp:reader-prefs')||'{}');var r=p.room==='ink'?'board':p.room;if(r==='board')document.documentElement.setAttribute('data-room','board')}catch(e){}",
        }}
      />
      <div
        className="fixed left-0 top-0 z-[60] h-[3px] bg-alert transition-[width] duration-150 ease-linear"
        style={{ width: `${progress * 100}%` }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-label="Reading progress"
      />
      <header className="board fixed top-0 z-50 w-full border-b border-board-line" data-room="board">
        <nav aria-label="Chapter" className="container-lp flex h-14 items-center justify-between gap-4">
          <Link
            href={`/book/${book.slug}`}
            className="flex min-w-0 items-center gap-2 text-board-dim transition-colors hover:text-board-text"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="truncate font-display text-base uppercase tracking-[0.04em]">{book.title}</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="cell mr-1 hidden uppercase text-board-dim sm:inline">
              {String(chapter.number).padStart(2, "0")} / {String(totalChapters).padStart(2, "0")}
            </span>
            <details ref={tocRef} className="relative">
              <summary className="tab cursor-pointer list-none [&::-webkit-details-marker]:hidden" aria-label="Jump to chapter" title="Contents">
                <List className="h-3.5 w-3.5" />
              </summary>
              <div className="pass absolute right-0 top-[calc(100%+0.5rem)] z-10 max-h-[70vh] w-72 max-w-[calc(100vw-2rem)] overflow-y-auto p-2">
                <p className="label px-2 pb-2 pt-1">Contents</p>
                <ul>
                  {chapters.map((c) => (
                    <li key={c.number}>
                      <button
                        type="button"
                        onClick={() => goToChapter(c.number)}
                        className={cn(
                          "flex w-full items-baseline gap-3 rounded-[2px] px-2 py-1.5 text-left text-sm transition-colors hover:bg-well",
                          c.number === chapter.number ? "text-ink" : "text-ink-dim",
                        )}
                      >
                        <span className="cell">{String(c.number).padStart(2, "0")}</span>
                        <span className="truncate font-prose">{c.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
            <button
              type="button"
              onClick={cycleSize}
              className="tab"
              aria-label={`Text size ${SIZE_LABELS[prefs.size]}. Click for ${SIZE_LABELS[SIZES[(SIZES.indexOf(prefs.size) + 1) % SIZES.length]]}.`}
              title={`Text size: ${SIZE_LABELS[prefs.size]}`}
            >
              <Type className="h-3.5 w-3.5" />
              <span className={cn("font-prose", prefs.size === "sm" && "text-xs", prefs.size === "lg" && "text-base")}>Aa</span>
            </button>
            <button
              type="button"
              onClick={() => update({ room: prefs.room === "paper" ? "board" : "paper" })}
              className="tab"
              aria-label={prefs.room === "paper" ? "Read on the board" : "Read on paper"}
              title={prefs.room === "paper" ? "Board" : "Paper"}
            >
              {prefs.room === "paper" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            </button>
          </div>
        </nav>
      </header>
      <div data-size={prefs.size} className="pt-14">
        {children}
      </div>
    </div>
  );
}
