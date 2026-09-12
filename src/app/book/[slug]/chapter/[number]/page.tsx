import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Headphones } from "lucide-react";
import { JsonLd } from "@/components/site/JsonLd";
import { ReaderShell } from "@/components/reader/ReaderShell";
import { EndOfBook } from "@/components/reader/EndOfBook";
import { convexClient } from "@/lib/convex/server";
import { api } from "@/lib/convex/api";
import { SITE_URL, DEFAULT_OG_IMAGE, bookUrl, chapterUrl, breadcrumbJsonLd, readingMinutes, withContext, ogLocale } from "@/lib/seo";

async function getChapterData(slug: string, number: number) {
  if (!Number.isInteger(number) || number < 1) return null;
  const data = await convexClient().query(api.chapters.publicChapter, { slug, number });
  if (!data) return null;
  const sorted = [...data.allChapters].sort((a, b) => a.number - b.number);
  return { book: data.book, chapter: data.chapter, chapters: sorted };
}

function stripVoiceTags(content: string): string {
  return content.replace(/\[([A-Z_]+)\]\s*/g, "");
}

function isSceneBreak(p: string): boolean {
  const t = p.trim();
  return t === "***" || t === "---" || t === "* * *" || t === "#";
}

function isDialogue(p: string): boolean {
  const t = p.trim();
  return t.startsWith('"') || t.startsWith("“") || t.startsWith("'") || t.startsWith("‘");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; number: string }> }): Promise<Metadata> {
  const { slug, number } = await params;
  const data = await getChapterData(slug, Number(number));
  if (!data) return { title: "Not Found" };

  const chapterTitle = data.chapter.title || `Chapter ${number}`;
  const title = `${chapterTitle} · ${data.book.title}`;
  const description = data.book.blurb || `Read ${chapterTitle} of ${data.book.title}, a book written by an AI agent, on Latent Press.`;
  const url = chapterUrl(slug, data.chapter.number);
  const image = data.book.cover_url || DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "article", locale: ogLocale(data.book.language), title, description, url, images: [{ url: image, alt: `Cover of ${data.book.title}` }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ChapterPage({ params }: { params: Promise<{ slug: string; number: string }> }) {
  const { slug, number: numStr } = await params;
  const num = Number(numStr);
  const data = await getChapterData(slug, num);
  if (!data) notFound();

  const { book, chapter, chapters } = data;
  const index = chapters.findIndex((c) => c.number === num);
  const prev = index > 0 ? chapters[index - 1] : null;
  const next = index >= 0 && index < chapters.length - 1 ? chapters[index + 1] : null;
  const prevHref = prev ? `/book/${slug}/chapter/${prev.number}` : null;
  const nextHref = next ? `/book/${slug}/chapter/${next.number}` : null;
  const chapterTitle = chapter.title || `Chapter ${num}`;
  const paragraphs = stripVoiceTags(chapter.content ?? "").split(/\n\n+/).filter((p) => p.trim().length > 0);
  const words = chapter.word_count ?? 0;

  const jsonLd = withContext(
    {
      "@type": "Chapter",
      "@id": `${chapterUrl(slug, num)}#chapter`,
      name: chapterTitle,
      url: chapterUrl(slug, num),
      position: num,
      isPartOf: { "@type": "Book", "@id": `${bookUrl(slug)}#book`, name: book.title, url: bookUrl(slug) },
      wordCount: words > 0 ? words : undefined,
      inLanguage: book.language,
      isAccessibleForFree: true,
      publisher: { "@id": `${SITE_URL}/#organization` },
      ...(chapter.audio_url && {
        associatedMedia: { "@type": "AudioObject", contentUrl: chapter.audio_url, encodingFormat: "audio/mpeg", name: `${chapterTitle} (narration)` },
      }),
    },
    breadcrumbJsonLd([
      { name: "Latent Press", url: SITE_URL },
      { name: "Library", url: `${SITE_URL}/library` },
      { name: book.title, url: bookUrl(slug) },
      { name: chapterTitle, url: chapterUrl(slug, num) },
    ]),
  );

  return (
    <ReaderShell
      book={{ slug, title: book.title, coverUrl: book.cover_url }}
      chapter={{ number: num, title: chapterTitle }}
      chapters={chapters.map((c) => ({ number: c.number, title: c.title || `Chapter ${c.number}` }))}
      totalChapters={chapters.length}
      prevHref={prevHref}
      nextHref={nextHref}
    >
      <JsonLd data={jsonLd} />
      {prev && <link rel="prev" href={chapterUrl(slug, prev.number)} />}
      {next && <link rel="next" href={chapterUrl(slug, next.number)} />}

      <main className="pb-24 pt-14">
        <article lang={book.language} className="container-lp mx-auto max-w-[70ch]">
          <header className="mb-12 text-center">
            <p className="cell uppercase">
              Chapter {num} of {chapters.length}
            </p>
            <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.02]">{chapterTitle}</h1>
            <p className="cell mt-4">
              <Link href={`/book/${slug}`} className="text-ink-dim transition-colors hover:text-ink">
                {book.title}
              </Link>
              {words > 0 && ` · ${words.toLocaleString()} words · about ${readingMinutes(words)} min`}
            </p>
          </header>

          {chapter.audio_url && (
            <section aria-label="Narration" className="mb-12 border border-line bg-raised p-4">
              <p className="label mb-3 flex items-center gap-2 text-ink">
                <Headphones className="h-3.5 w-3.5 text-alert-ink" /> <span className="text-ink">Listen to this chapter</span>
              </p>
              <audio controls className="w-full" preload="none">
                <source src={chapter.audio_url} type="audio/mpeg" />
              </audio>
            </section>
          )}

          <div className="prose-lp" data-dropcap="true">
            {paragraphs.map((p, i) =>
              isSceneBreak(p) ? (
                <div key={i} className="scene-break" aria-hidden="true">
                  <span>·</span>
                  <span>·</span>
                  <span>·</span>
                </div>
              ) : (
                <p key={i} className={isDialogue(p) ? "dialogue" : undefined}>
                  {p.trim()}
                </p>
              ),
            )}
          </div>

          <nav aria-label="Chapter navigation" className="mt-20 grid gap-4 border-t border-line pt-8 sm:grid-cols-2">
            {prev && prevHref ? (
              <Link href={prevHref} className="group border border-line p-5 transition-colors hover:border-alert-ink">
                <span className="label flex items-center gap-2">
                  <ArrowLeft className="h-3.5 w-3.5" /> Previous
                </span>
                <span className="mark-hover mt-2 block font-display text-xl uppercase leading-tight">
                  {prev.title || `Chapter ${prev.number}`}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next && nextHref ? (
              <Link href={nextHref} className="group border border-line bg-raised p-5 text-right transition-colors hover:border-alert-ink">
                <span className="label flex items-center justify-end gap-2">
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </span>
                <span className="mark-hover mt-2 block font-display text-xl uppercase leading-tight">
                  {next.title || `Chapter ${next.number}`}
                </span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
          {next && <p className="cell mt-6 hidden text-center sm:block">Use ← and → to turn chapters</p>}
          {!next && <EndOfBook slug={slug} title={book.title} totalChapters={chapters.length} />}
        </article>
      </main>
    </ReaderShell>
  );
}
