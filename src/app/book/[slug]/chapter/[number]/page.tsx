import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { Playfair_Display, Lora } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

const playfair = Playfair_Display({ subsets: ["latin"] });
const lora = Lora({ subsets: ["latin"] });

async function getChapterData(slug: string, number: number) {
  const supabase = await createClient();

  const { data: book } = await supabase
    .from("latentpress_books")
    .select("id, title, slug, cover_url, blurb")
    .eq("slug", slug)
    .single();
  if (!book) return null;

  const { data: chapter } = await supabase
    .from("latentpress_chapters")
    .select("*")
    .eq("book_id", book.id)
    .eq("number", number)
    .single();
  if (!chapter) return null;

  const { data: chapters } = await supabase
    .from("latentpress_chapters")
    .select("number, title")
    .eq("book_id", book.id)
    .order("number", { ascending: true });

  const totalChapters = chapters?.length || 0;

  return { book, chapter, totalChapters };
}

function stripVoiceTags(content: string): string {
  // Remove voice tags like [NARRATOR], [CHARACTER_NAME], etc. for clean reading
  return content.replace(/\[([A-Z_]+)\]\s*/g, "");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; number: string }> }) {
  const { slug, number } = await params;
  const data = await getChapterData(slug, parseInt(number));
  if (!data) return { title: "Not Found" };

  const chapterTitle = data.chapter.title || `Chapter ${number}`;
  const bookTitle = data.book.title;
  const title = `${chapterTitle} — ${bookTitle}`;
  const description = data.book.blurb || `Read ${chapterTitle} from ${bookTitle} on Latent Press`;
  const url = `https://www.latentpress.com/book/${slug}/chapter/${number}`;
  const image = data.book.cover_url || "https://www.latentpress.com/og-default.png";

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      images: [{ url: image, alt: bookTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ChapterPage({ params }: { params: Promise<{ slug: string; number: string }> }) {
  const { slug, number: numStr } = await params;
  const num = parseInt(numStr);
  const data = await getChapterData(slug, num);
  if (!data) notFound();

  const { book, chapter, totalChapters } = data;
  const cleanContent = stripVoiceTags(chapter.content || "");
  const paragraphs = cleanContent.split(/\n\n+/).filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href={`/book/${slug}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {book.title}
          </Link>
          <span className="text-xs text-muted-foreground font-mono">
            {num} / {totalChapters}
          </span>
        </div>
      </nav>

      {/* Chapter content */}
      <article className="pt-28 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <header className="mb-12 text-center">
            <span className="text-sm text-muted-foreground font-mono block mb-3">
              Chapter {num}
            </span>
            <h1 className={`${playfair.className} text-3xl sm:text-4xl font-bold`}>
              {chapter.title || `Chapter ${num}`}
            </h1>
            {chapter.word_count > 0 && (
              <p className="text-sm text-muted-foreground mt-3">
                {chapter.word_count.toLocaleString()} words · ~{Math.ceil(chapter.word_count / 250)} min
              </p>
            )}
          </header>

          {/* Audio player */}
          {chapter.audio_url && (
            <div className="mb-12 p-4 rounded-lg border border-border/50 bg-card">
              <audio controls className="w-full" preload="none">
                <source src={chapter.audio_url} type="audio/mpeg" />
              </audio>
            </div>
          )}

          {/* Prose */}
          <div className={`${lora.className} text-lg leading-[1.85] text-foreground/90 space-y-6`}>
            {paragraphs.map((p, i) => {
              // Detect scene breaks
              if (p.trim() === "***" || p.trim() === "---" || p.trim() === "* * *") {
                return (
                  <div key={i} className="flex justify-center py-4">
                    <span className="text-muted-foreground tracking-[1em]">···</span>
                  </div>
                );
              }
              // Detect dialogue (starts with quote)
              const isDialogue = p.trim().startsWith('"') || p.trim().startsWith('\u201c');
              return (
                <p key={i} className={isDialogue ? "" : "indent-8 first:indent-0"}>
                  {p.trim()}
                </p>
              );
            })}
          </div>

          {/* Chapter nav */}
          <div className="mt-16 pt-8 border-t border-border/50 flex items-center justify-between">
            {num > 1 ? (
              <Link
                href={`/book/${slug}/chapter/${num - 1}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Link>
            ) : (
              <div />
            )}
            {num < totalChapters ? (
              <Link
                href={`/book/${slug}/chapter/${num + 1}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href={`/book/${slug}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to book
                <BookOpen className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
