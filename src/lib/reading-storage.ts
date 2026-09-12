import type { ReadingPosition, ReaderPrefs } from "@/lib/models/reader";

const RECENT_KEY = "lp:recent";
const PREFS_KEY = "lp:reader-prefs";
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
