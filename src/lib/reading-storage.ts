import type { ReadingPosition, ReaderPrefs } from "@/lib/models/reader";

const RECENT_KEY = "lp:recent";
const PREFS_KEY = "lp:reader-prefs";
const REVIEWER_KEY = "lp:reviewer-id";
const RATINGS_KEY = "lp:ratings";
const PINGED_KEY = "lp:pinged";
const MAX_RECENT = 6;

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: private mode or quota */
  }
}

export function readRecent(): ReadingPosition[] {
  return safeRead<ReadingPosition[]>(RECENT_KEY, []);
}

export function readPosition(slug: string): ReadingPosition | null {
  return readRecent().find((p) => p.slug === slug) ?? null;
}

export function savePosition(position: ReadingPosition): void {
  const others = readRecent().filter((p) => p.slug !== position.slug);
  safeWrite(RECENT_KEY, [position, ...others].slice(0, MAX_RECENT));
}

export function readPrefs(): ReaderPrefs {
  const prefs = safeRead<ReaderPrefs>(PREFS_KEY, { size: "md", room: "paper" });
  // "ink" was this preference's old name; keep readers who picked it.
  if ((prefs.room as string) === "ink") return { ...prefs, room: "board" };
  return prefs;
}

export function savePrefs(prefs: ReaderPrefs): void {
  safeWrite(PREFS_KEY, prefs);
}

// A dedupe key, not a credential. It stops this browser filing two reviews of the
// same book, and clearing storage is enough to file another one, which is fine.
export function readReviewerId(): string {
  const existing = safeRead<string | null>(REVIEWER_KEY, null);
  if (typeof existing === "string" && existing) return existing;
  const id = crypto.randomUUID();
  safeWrite(REVIEWER_KEY, id);
  return id;
}

// Mirrors the rating this browser gave, so the stars show as chosen on the next
// visit. The server copy is the truth; this only paints the widget.
export function readBookRating(slug: string): number {
  return safeRead<Record<string, number>>(RATINGS_KEY, {})[slug] ?? 0;
}

export function saveBookRating(slug: string, stars: number): void {
  safeWrite(RATINGS_KEY, { ...safeRead<Record<string, number>>(RATINGS_KEY, {}), [slug]: stars });
}

// Session-scoped memory of which chapter opens were already counted, so
// navigating back and forth in one sitting does not inflate the tally.
export function markChapterOpened(slug: string, chapter: number): boolean {
  const key = `${slug}:${chapter}`;
  try {
    const raw = window.sessionStorage.getItem(PINGED_KEY);
    const seen = raw ? (JSON.parse(raw) as string[]) : [];
    if (seen.includes(key)) return false;
    window.sessionStorage.setItem(PINGED_KEY, JSON.stringify([...seen, key].slice(-200)));
    return true;
  } catch {
    return true;
  }
}
