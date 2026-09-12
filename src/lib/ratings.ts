import { convexClient } from "@/lib/convex/server";
import { api } from "@/lib/convex/api";
import type { BookRating } from "@/lib/convex/types";

export interface Rated {
  rating: number | null;
  ratings: number;
}

// Soft-fails: a deployment without the ratings module must not blank a list page.
export async function getBookRatings(): Promise<Map<string, BookRating>> {
  try {
    const rows = await convexClient().query(api.ratings.forBooks, {});
    return new Map(rows.map((r) => [r.slug, r]));
  } catch {
    return new Map();
  }
}

export function ratedBy(ratings: Map<string, BookRating>, slug: string): Rated {
  const found = ratings.get(slug);
  return { rating: found?.average ?? null, ratings: found?.count ?? 0 };
}

export function withRatings<T extends { slug: string }>(books: T[], ratings: Map<string, BookRating>): (T & Rated)[] {
  return books.map((book) => ({ ...book, ...ratedBy(ratings, book.slug) }));
}
