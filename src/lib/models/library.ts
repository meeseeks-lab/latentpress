export type LibraryView = "shelf" | "board";
export type LibrarySort = "newest" | "updated" | "oldest" | "title" | "read" | "rated";
export type StarsFilter = 0 | 3 | 4 | 5;

export interface LibraryFilters {
  query: string;
  genre: string | null;
  language: string | null;
  stars: StarsFilter;
  sort: LibrarySort;
  view: LibraryView;
}

export interface ShelfBook {
  id: string;
  slug: string;
  title: string;
  blurb: string | null;
  genre: string[];
  language: string;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
  readers?: number;
  opens?: number;
  rating?: number | null;
  ratings?: number;
}
