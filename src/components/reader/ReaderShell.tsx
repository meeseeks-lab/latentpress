"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Moon, Sun, Type } from "lucide-react";
import type { ProseSize, ReaderPrefs, ReadingPosition } from "@/lib/models/reader";
import { readPrefs, savePosition, savePrefs } from "@/lib/reading-storage";
import { cn } from "@/lib/utils";

interface ReaderShellProps {
  book: { slug: string; title: string; coverUrl: string | null };
  chapter: { number: number; title: string };
  totalChapters: number;
  prevHref: string | null;
  nextHref: string | null;
  children: ReactNode;
}

const SIZES: ProseSize[] = ["sm", "md", "lg"];

export function ReaderShell({ book, chapter, totalChapters, prevHref, nextHref, children }: ReaderShellProps) {
  const router = useRouter();
  const [prefs, setPrefs] = useState<ReaderPrefs>({ size: "md", room: "paper" });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setPrefs(readPrefs());
  }, []);

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
    const id = window.setTimeout(() => savePosition(position), 400);
    return () => window.clearTimeout(id);
  }, [book, chapter, totalChapters, progress]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
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

  return (
    <div data-room={prefs.room} className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div
        className="fixed left-0 top-0 z-[60] h-[3px] bg-lamp transition-[width] duration-150 ease-linear"
        style={{ width: `${progress * 100}%` }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-label="Reading progress"
      />
      <header className="fixed top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur-md">
        <nav aria-label="Chapter" className="container-lp flex h-14 items-center justify-between gap-4">
          <Link
            href={`/book/${book.slug}`}
            className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="truncate font-display">{book.title}</span>
          </Link>
          <div className="flex items-center gap-1">
            <span className="mr-2 hidden text-xs tabular-nums text-muted-foreground sm:inline">
              {chapter.number} / {totalChapters}
            </span>
            <button
              type="button"
              onClick={cycleSize}
              className="chip h-8 gap-1.5"
              aria-label={`Text size: ${prefs.size}. Click to change.`}
              title="Text size"
            >
              <Type className="h-3.5 w-3.5" />
              <span className="uppercase">{prefs.size}</span>
            </button>
            <button
              type="button"
              onClick={() => update({ room: prefs.room === "paper" ? "ink" : "paper" })}
              className="chip h-8"
              aria-label={prefs.room === "paper" ? "Switch to night reading" : "Switch to paper reading"}
              title={prefs.room === "paper" ? "Night" : "Paper"}
            >
              {prefs.room === "paper" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            </button>
          </div>
        </nav>
      </header>
      <div data-size={prefs.size} className={cn("pt-14")}>
        {children}
      </div>
    </div>
  );
}
