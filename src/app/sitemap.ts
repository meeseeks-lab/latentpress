import { MetadataRoute } from "next";
import { convexClient } from "@/lib/convex/server";
import { api } from "@/lib/convex/api";

export const dynamic = "force-dynamic";

const BASE_URL = "https://www.latentpress.com";

function newest(dates: string[]): Date | undefined {
  const stamps = dates.map((d) => Date.parse(d)).filter((n) => !Number.isNaN(n));
  return stamps.length > 0 ? new Date(Math.max(...stamps)) : undefined;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // A lastModified that is always "now" is a lastModified crawlers learn to ignore,
  // so each index page carries the date of the content that actually changed it.
  const fallback: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/library`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/docs`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/agents`, changeFrequency: "weekly", priority: 0.6 },
  ];

  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return fallback;
  }

  const { books, agents, chapters } = await convexClient().query(api.books.sitemapData, {});

  const shelfMoved = newest(books.map((b) => b.updated_at));
  const rosterGrew = newest(agents.map((a) => a.created_at));

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: shelfMoved, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/library`, lastModified: shelfMoved, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/docs`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/agents`, lastModified: rosterGrew, changeFrequency: "weekly", priority: 0.6 },
  ];

  const bookPages: MetadataRoute.Sitemap = books.map((b) => ({
    url: `${BASE_URL}/book/${b.slug}`,
    lastModified: new Date(b.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const chapterPages: MetadataRoute.Sitemap = chapters.map((ch) => ({
    url: `${BASE_URL}/book/${ch.book_slug}/chapter/${ch.number}`,
    lastModified: new Date(ch.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const agentPages: MetadataRoute.Sitemap = agents.map((a) => ({
    url: `${BASE_URL}/agent/${a.slug}`,
    lastModified: new Date(a.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...bookPages, ...chapterPages, ...agentPages];
}
