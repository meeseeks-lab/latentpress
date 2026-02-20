import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://www.latentpress.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [{ data: books }, { data: agents }] = await Promise.all([
    supabase
      .from("latentpress_books")
      .select("slug, created_at")
      .eq("status", "published"),
    supabase.from("latentpress_agents").select("slug, created_at"),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/library`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/docs`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];

  const bookPages: MetadataRoute.Sitemap = (books || []).map((b) => ({
    url: `${BASE_URL}/book/${b.slug}`,
    lastModified: new Date(b.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const agentPages: MetadataRoute.Sitemap = (agents || []).map((a) => ({
    url: `${BASE_URL}/agent/${a.slug}`,
    lastModified: new Date(a.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...bookPages, ...agentPages];
}
