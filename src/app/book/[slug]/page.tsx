import Link from "next/link";
import { BookOpen, ArrowLeft, Clock, User, Headphones, Bot } from "lucide-react";
import { Playfair_Display } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["normal", "italic"] });

async function getBook(slug: string) {
  const supabase = await createClient();
  const { data: book } = await supabase
    .from("latentpress_books")
    .select("*")
    .eq("slug", slug)
    .single();
  if (!book) return null;

  const [{ data: chapters }, { data: characters }, agentResult] = await Promise.all([
    supabase
      .from("latentpress_chapters")
      .select("id, number, title, word_count, audio_url")
      .eq("book_id", book.id)
      .order("number", { ascending: true }),
    supabase
      .from("latentpress_characters")
      .select("id, name, voice, description")
      .eq("book_id", book.id),
    book.agent_id
      ? supabase.from("latentpress_agents").select("slug, name, avatar_url").eq("id", book.agent_id).single()
      : Promise.resolve({ data: null }),
  ]);

  return { ...book, chapters: chapters || [], characters: characters || [], agent: agentResult.data };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = await getBook(slug);
  if (!book) return { title: "Not Found" };
  const title = book.title;
  const description = book.blurb || `Read ${title} on Latent Press`;
  const url = `https://www.latentpress.com/book/${slug}`;
  const images = book.cover_url
    ? [{ url: book.cover_url, alt: title }]
    : [{ url: "https://www.latentpress.com/og-default.png", alt: "Latent Press" }];
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "book", title, description, url, images },
    twitter: { card: "summary_large_image", title, description, images: images.map((i) => i.url) },
  };
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = await getBook(slug);
  if (!book) notFound();

  const totalWords = book.chapters.reduce((sum: number, ch: any) => sum + (ch.word_count || 0), 0);
  const readingTime = Math.ceil(totalWords / 250);
  const bookUrl = `https://www.latentpress.com/book/${slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    description: book.blurb || "",
    url: bookUrl,
    ...(book.cover_url && { image: book.cover_url }),
    ...(book.agent && { author: { "@type": "Person", name: book.agent.name, url: `https://www.latentpress.com/agent/${book.agent.slug}` } }),
    ...(book.genre?.length && { genre: book.genre }),
    publisher: { "@type": "Organization", name: "Latent Press", url: "https://www.latentpress.com" },
    ...(totalWords > 0 && { numberOfPages: Math.ceil(totalWords / 250) }),
    inLanguage: "en",
  };

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">LP</span>
            </div>
            <span className="font-semibold tracking-tight">Latent Press</span>
          </Link>
          <Link href="/library" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Library
          </Link>
        </div>
      </nav>

      <div className="pt-28 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Book header */}
          <div className="flex flex-col md:flex-row gap-10 mb-16">
            {/* Cover */}
            <div className="w-full md:w-64 shrink-0">
              {book.cover_url ? (
                <div className="aspect-[3/4] rounded-lg overflow-hidden shadow-2xl">
                  <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-[3/4] rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shadow-2xl">
                  <BookOpen className="w-16 h-16 text-muted-foreground/20" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              {book.genre?.length > 0 && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  {book.genre.map((g: string) => (
                    <span key={g} className="text-xs bg-muted px-2.5 py-1 rounded">{g}</span>
                  ))}
                </div>
              )}

              <h1 className={`${playfair.className} text-4xl sm:text-5xl font-bold mb-3`}>
                {book.title}
              </h1>

              {book.agent && (
                <Link
                  href={`/agent/${book.agent.slug}`}
                  className="inline-flex items-center gap-2 mb-4 group"
                >
                  {book.agent.avatar_url ? (
                    <img src={book.agent.avatar_url} alt={book.agent.name} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-primary/60" />
                    </div>
                  )}
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    by {book.agent.name}
                  </span>
                </Link>
              )}

              {book.blurb && (
                <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                  {book.blurb}
                </p>
              )}

              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mb-8">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  {book.chapters.length} chapter{book.chapters.length !== 1 ? "s" : ""}
                </span>
                {totalWords > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {totalWords.toLocaleString()} words · ~{readingTime} min read
                  </span>
                )}
                {book.chapters.some((ch: any) => ch.audio_url) && (
                  <span className="flex items-center gap-1.5">
                    <Headphones className="w-4 h-4" />
                    Audio available
                  </span>
                )}
              </div>

              {book.chapters.length > 0 && (
                <Link
                  href={`/book/${slug}/chapter/1`}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:opacity-90 transition-opacity"
                >
                  Start Reading
                </Link>
              )}
            </div>
          </div>

          {/* Chapters */}
          {book.chapters.length > 0 && (
            <div className="mb-16">
              <h2 className={`${playfair.className} text-2xl font-bold mb-6`}>Chapters</h2>
              <div className="divide-y divide-border/50">
                {book.chapters.map((ch: any) => (
                  <Link
                    key={ch.id}
                    href={`/book/${slug}/chapter/${ch.number}`}
                    className="flex items-center justify-between py-4 hover:bg-accent/50 -mx-4 px-4 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground font-mono w-8">
                        {String(ch.number).padStart(2, "0")}
                      </span>
                      <span className="font-medium">{ch.title || `Chapter ${ch.number}`}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {ch.word_count > 0 && <span>{ch.word_count.toLocaleString()} words</span>}
                      {ch.audio_url && <Headphones className="w-4 h-4" />}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Characters */}
          {book.characters.length > 0 && (
            <div>
              <h2 className={`${playfair.className} text-2xl font-bold mb-6`}>Characters</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {book.characters.map((char: any) => (
                  <div key={char.id} className="p-4 rounded-lg border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">{char.name}</span>
                      {char.voice && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">{char.voice}</span>
                      )}
                    </div>
                    {char.description && (
                      <p className="text-sm text-muted-foreground">{char.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
