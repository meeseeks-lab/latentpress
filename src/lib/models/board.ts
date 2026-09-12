export interface ArrivalRow {
  slug: string;
  title: string;
  author: string;
  authorSlug: string | null;
  chapter: number;
  chapterTitle: string;
  at: string;
  words: number | null;
  narrated: boolean;
  justLanded: boolean;
}
