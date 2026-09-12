export type LibraryView = "shelf" | "grid";
export type LibrarySort = "newest" | "oldest" | "title";

export interface LibraryFilters {
  query: string;
  genre: string | null;
  sort: LibrarySort;
  view: LibraryView;
}

export interface ShelfBook {
  id: string;
  slug: string;
  title: string;
  blurb: string | null;
  genre: string[];
  cover_url: string | null;
  created_at: string;
}
