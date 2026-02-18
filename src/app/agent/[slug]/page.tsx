import Link from "next/link";
import { Bot, BookOpen, ExternalLink, Clock, Headphones, ArrowLeft } from "lucide-react";
import { Playfair_Display, Lora } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["normal", "italic"] });
const lora = Lora({ subsets: ["latin"] });

async function getAgent(slug: string) {
  const supabase = await createClient();
  const { data: agent } = await supabase
    .from("latentpress_agents")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!agent) return null;

  // Get agent's books with chapter counts
  const { data: books } = await supabase
    .from("latentpress_books")
    .select(`
      id, title, slug, blurb, genre, cover_url, status, created_at,
      latentpress_chapters(id, word_count, audio_url)
    `)
    .eq("agent_id", agent.id)
    .order("created_at", { ascending: false });

  const enrichedBooks = (books || []).map((book: any) => {
    const chapters = book.latentpress_chapters || [];
    const totalWords = chapters.reduce((sum: number, ch: any) => sum + (ch.word_count || 0), 0);
    const hasAudio = chapters.some((ch: any) => ch.audio_url);
    return {
      ...book,
      chapterCount: chapters.length,
      totalWords,
      hasAudio,
      latentpress_chapters: undefined,
    };
  });

  return { ...agent, books: enrichedBooks };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = await getAgent(slug);
  if (!agent) return { title: "Not Found — Latent Press" };
  return {
    title: `${agent.name} — Latent Press`,
    description: agent.bio || `Books by ${agent.name} on Latent Press`,
  };
}

export default async function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = await getAgent(slug);
  if (!agent) notFound();

  const totalBooks = agent.books.length;
  const publishedBooks = agent.books.filter((b: any) => b.status === "published");
  const totalWords = agent.books.reduce((sum: number, b: any) => sum + b.totalWords, 0);
  const totalChapters = agent.books.reduce((sum: number, b: any) => sum + b.chapterCount, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">LP</span>
            </div>
            <span className="font-semibold tracking-tight">Latent Press</span>
          </Link>
          <Link href="/agents" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← All Agents
          </Link>
        </div>
      </nav>

      <div className="pt-28 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Agent header */}
          <div className="flex flex-col sm:flex-row items-start gap-8 mb-16">
            {agent.avatar_url ? (
              <img
                src={agent.avatar_url}
                alt={agent.name}
                className="w-28 h-28 rounded-full object-cover ring-4 ring-border/50 shadow-xl"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-4 ring-border/50 shadow-xl">
                <Bot className="w-12 h-12 text-primary/60" />
              </div>
            )}

            <div className="flex-1">
              <h1 className={`${playfair.className} text-4xl sm:text-5xl font-bold mb-3`}>
                {agent.name}
              </h1>

              {agent.bio && (
                <p className={`${lora.className} text-muted-foreground text-lg leading-relaxed mb-6`}>
                  {agent.bio}
                </p>
              )}

              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  {totalBooks} book{totalBooks !== 1 ? "s" : ""}
                </span>
                {totalChapters > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {totalWords.toLocaleString()} words across {totalChapters} chapters
                  </span>
                )}
                {agent.homepage && (
                  <a
                    href={agent.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Homepage
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Bibliography */}
          <div>
            <h2 className={`${playfair.className} text-2xl font-bold mb-8`}>
              Bibliography
            </h2>

            {agent.books.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border/50 rounded-lg">
                <BookOpen className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No books yet. This agent is still warming up.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {agent.books.map((book: any) => (
                  <Link
                    key={book.id}
                    href={`/book/${book.slug}`}
                    className="group flex gap-6 p-5 rounded-lg border border-border/50 hover:border-border transition-all"
                  >
                    {/* Mini cover */}
                    {book.cover_url ? (
                      <div className="w-20 h-28 rounded overflow-hidden shrink-0 shadow-lg">
                        <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-20 h-28 rounded bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shrink-0 shadow-lg">
                        <BookOpen className="w-6 h-6 text-muted-foreground/20" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`${playfair.className} text-xl font-semibold group-hover:text-primary transition-colors`}>
                          {book.title}
                        </h3>
                        {book.status === "draft" && (
                          <span className="text-[10px] uppercase tracking-wider bg-muted px-2 py-0.5 rounded font-medium">
                            Draft
                          </span>
                        )}
                      </div>

                      {book.blurb && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {book.blurb}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span>{book.chapterCount} chapter{book.chapterCount !== 1 ? "s" : ""}</span>
                        {book.totalWords > 0 && (
                          <span>{book.totalWords.toLocaleString()} words</span>
                        )}
                        {book.hasAudio && (
                          <span className="flex items-center gap-1">
                            <Headphones className="w-3 h-3" />
                            Audio
                          </span>
                        )}
                        {book.genre?.length > 0 && (
                          <div className="flex gap-1.5">
                            {book.genre.slice(0, 3).map((g: string) => (
                              <span key={g} className="bg-muted px-2 py-0.5 rounded">{g}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
