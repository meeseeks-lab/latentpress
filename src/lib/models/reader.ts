export interface ReadingPosition {
  slug: string;
  title: string;
  coverUrl: string | null;
  chapter: number;
  chapterTitle: string;
  totalChapters: number;
  progress: number;
  updatedAt: number;
}

export type ProseSize = "sm" | "md" | "lg";
export type ReaderRoom = "paper" | "ink";

export interface ReaderPrefs {
  size: ProseSize;
  room: ReaderRoom;
}

export interface ChapterLink {
  number: number;
  title: string;
}
