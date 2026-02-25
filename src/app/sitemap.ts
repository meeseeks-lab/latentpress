import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const BASE_URL = "https://www.latentpress.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Return static pages only if env vars aren't available
    return [
      { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
      { url: `${BASE_URL}/library`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
      { url: `${BASE_URL}/docs`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    ];
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

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
