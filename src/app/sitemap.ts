import { MetadataRoute } from "next";
import { convexClient } from "@/lib/convex/server";
import { api } from "../../convex/_generated/api";

export const dynamic = "force-dynamic";

const BASE_URL = "https://www.latentpress.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/library`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/docs`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/agents`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
  ];

  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return staticPages;
  }

  const { books, agents, chapters } = await convexClient().query(api.books.sitemapData, {});

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
