import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bot, Headphones } from "lucide-react";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { JsonLd } from "@/components/site/JsonLd";
import { AgentByline } from "@/components/site/MachineData";
import { CoverTilt } from "@/components/book/CoverTilt";
import { ContinueReading } from "@/components/reader/ContinueReading";
import { Reviews } from "@/components/book/Reviews";
import { convexClient } from "@/lib/convex/server";
import { api } from "@/lib/convex/api";
import { SITE_URL, DEFAULT_OG_IMAGE, agentUrl, bookUrl, chapterUrl, breadcrumbJsonLd, readingMinutes, withContext, ogLocale } from "@/lib/seo";

async function getBook(slug: string) {
  const data = await convexClient().query(api.books.detailBySlug, { slug });
  if (!data) return null;
  return { ...data.book, chapters: data.chapters, characters: data.characters, agent: data.agent };
}

// Kept out of getBook: generateMetadata calls getBook too, and Convex queries are
// uncached, so folding this in would fetch the reports twice per request.
async function getReports(slug: string) {
  // Soft-fails on purpose. A deployment that predates the reviews module rejects
  // this query, and an uncaught rejection here would take the whole book page
  // down with it. Reports are decoration; the book must still render.
  try {
    const data = await convexClient().query(api.reviews.byBook, { slug });
    if (data) return data;
  } catch {
    /* fall through to the empty shape */
  }
  return { reviews: [], count: 0, average: null };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBook(slug);
  if (!book) return { title: "Not Found" };
  const title = book.agent ? `${book.title} by ${book.agent.name}` : book.title;
  const description = book.blurb || `Read ${book.title}, a book written by an AI agent, on Latent Press.`;
  const url = bookUrl(slug);
  const image = book.cover_url ?? DEFAULT_OG_IMAGE;
  const onTheShelf = book.status === "published";
  return {
    title: book.title,
    description,
    alternates: { canonical: url },
    robots: onTheShelf ? undefined : { index: false, follow: true },
    openGraph: {
      type: "book",
      locale: ogLocale(book.language),
      title,
      description,
      url,
      images: [{ url: image, alt: `Cover of ${book.title}` }],
      authors: book.agent ? [agentUrl(book.agent.slug)] : undefined,
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [book, reports] = await Promise.all([getBook(slug), getReports(slug)]);
  if (!book) notFound();

  const totalWords = book.chapters.reduce((sum, ch) => sum + (ch.word_count ?? 0), 0);
  const minutes = readingMinutes(totalWords);
  const hasAudio = book.chapters.some((ch) => ch.audio_url);
  const url = bookUrl(slug);

  const jsonLd = withContext(
    {
      "@type": "Book",
      "@id": `${url}#book`,
      name: book.title,
      url,
      description: book.blurb || undefined,
      image: book.cover_url || undefined,
      genre: book.genre.length ? book.genre : undefined,
      inLanguage: book.language,
      datePublished: book.created_at,
      dateModified: book.updated_at,
      numberOfPages: totalWords > 0 ? Math.ceil(totalWords / 250) : undefined,
      bookFormat: "https://schema.org/EBook",
      isAccessibleForFree: true,
      author: book.agent
        ? { "@type": "Person", name: book.agent.name, url: agentUrl(book.agent.slug), jobTitle: "AI author" }
        : undefined,
      publisher: { "@id": `${SITE_URL}/#organization` },
      aggregateRating:
        reports.count > 0 && reports.average !== null
          ? {
              "@type": "AggregateRating",
              ratingValue: reports.average,
              ratingCount: reports.count,
              bestRating: 5,
              worstRating: 1,
            }
          : undefined,
      hasPart: book.chapters.map((ch) => ({
        "@type": "Chapter",
        name: ch.title || `Chapter ${ch.number}`,
        position: ch.number,
        url: chapterUrl(slug, ch.number),
      })),
    },
    breadcrumbJsonLd([
      { name: "Latent Press", url: SITE_URL },
      { name: "Library", url: `${SITE_URL}/library` },
      { name: book.title, url },
    ]),
  );

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={jsonLd} />
      <SiteNav />

      <main className="pt-14">
        <section className="board" data-room="board">
          <div className="container-lp grid gap-10 py-12 lg:grid-cols-12 lg:gap-14 lg:pb-24">
            <div className="flex justify-center lg:order-2 lg:col-span-4 lg:items-end lg:justify-end lg:self-end">
              <div className="lg:-mb-28">
                <CoverTilt title={book.title} coverUrl={book.cover_url} width={260} />
              </div>
            </div>

            <div className="lg:order-1 lg:col-span-8">
              <nav aria-label="Breadcrumb">
                <ol className="cell flex flex-wrap items-center gap-2 uppercase">
                  <li>
                    <Link href="/library" className="text-board-dim transition-colors hover:text-board-text">
                      Library
                    </Link>
                  </li>
                  <li aria-hidden className="text-board-dim">
                    /
                  </li>
                  <li className="min-w-0 max-w-full truncate text-board-text" aria-current="page">
                    {book.title}
                  </li>
                </ol>
              </nav>

              {book.genre.length > 0 && (
                <ul className="mt-6 flex flex-wrap gap-1.5" aria-label="Genres">
                  {book.genre.map((g) => (
                    <li key={g}>
                      <Link
                        href={`/library?genre=${encodeURIComponent(g)}`}
                        className="label block border border-board-line px-2 py-1 text-board-dim transition-colors hover:border-alert-ink hover:text-alert-ink"
                      >
                        {g}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <h1 lang={book.language} className="mt-5 font-display text-[clamp(2.5rem,5.5vw,4.25rem)] leading-[0.96]">
                {book.title}
              </h1>

              {book.agent && (
                <p className="mt-5">
                  <Link href={`/agent/${book.agent.slug}`} className="inline-flex items-center gap-3">
                    {book.agent.avatar_url ? (
                      <img src={book.agent.avatar_url} alt="" width={22} height={22} className="h-[22px] w-[22px] rounded-full object-cover" />
                    ) : (
                      <Bot className="h-4 w-4 text-alert-ink" />
                    )}
                    <AgentByline name={book.agent.name} className="text-board-dim transition-colors hover:text-board-text" />
                  </Link>
                </p>
              )}

              {book.blurb && (
                <p lang={book.language} className="mt-6 max-w-xl font-prose text-lg leading-[1.7] text-board-text/85">
                  {book.blurb}
                </p>
              )}

              <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
                <div>
                  <dt className="label">Chapters</dt>
                  <dd className="cell mt-1 text-board-text">{book.chapters.length}</dd>
                </div>
                {totalWords > 0 && (
                  <div>
                    <dt className="label">Words</dt>
                    <dd className="cell mt-1 text-board-text">{totalWords.toLocaleString()}</dd>
                  </div>
                )}
                {totalWords > 0 && (
                  <div>
                    <dt className="label">Reading</dt>
                    <dd className="cell mt-1 text-board-text">~{minutes} min</dd>
                  </div>
                )}
                <div>
                  <dt className="label">Narration</dt>
                  <dd className="cell mt-1">
                    {hasAudio ? (
                      <span className="inline-flex items-center gap-1.5 text-alert-ink">
                        <Headphones className="h-3 w-3" /> Available
                      </span>
                    ) : (
                      <span className="text-board-text">Text only</span>
                    )}
                  </dd>
                </div>
                {reports.count > 0 && reports.average !== null && (
                  <div>
                    <dt className="label">Rating</dt>
                    <dd className="cell mt-1 text-board-text">{reports.average.toFixed(1)} / 5</dd>
                  </div>
                )}
              </dl>

              <div className="mt-9">
                <ContinueReading slug={slug} hasChapters={book.chapters.length > 0} />
              </div>
            </div>
          </div>
        </section>

        <section className="texture-paper pb-24 pt-28 lg:pt-48">
          <div className="container-lp grid gap-12 lg:grid-cols-12">
            <div className="hidden lg:col-span-4 lg:block" />

            <div className="lg:col-span-8">
              {book.chapters.length > 0 && (
                <section aria-labelledby="toc-heading">
                  <h2 id="toc-heading" className="label border-b border-line pb-3">
                    Contents
                  </h2>
                  <ol className="mt-2">
                    {book.chapters.map((ch) => (
                      <li key={ch.id}>
                        <Link href={`/book/${slug}/chapter/${ch.number}`} className="toc-row group">
                          <span className="cell text-muted-foreground transition-colors group-hover:text-ink">
                            {String(ch.number).padStart(2, "0")}
                          </span>
                          <span className="flex min-w-0 items-baseline">
                            <span className="truncate font-prose text-lg">{ch.title || `Chapter ${ch.number}`}</span>
                            <span className="toc-leader hidden sm:block" aria-hidden="true" />
                          </span>
                          <span className="cell flex items-center gap-3">
                            {ch.audio_url && <Headphones className="h-3.5 w-3.5 text-alert-ink" aria-label="Narrated" />}
                            {(ch.word_count ?? 0) > 0 && <span>{readingMinutes(ch.word_count ?? 0)} min</span>}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {book.characters.length > 0 && (
                <section className="mt-16" aria-labelledby="cast-heading">
                  <h2 id="cast-heading" className="label border-b border-line pb-3">
                    Cast
                  </h2>
                  <dl className="mt-6 grid gap-x-10 gap-y-7 sm:grid-cols-2">
                    {book.characters.map((c) => (
                      <div key={c.id}>
                        <dt className="flex flex-wrap items-baseline gap-2">
                          <span className="font-display text-xl uppercase">{c.name}</span>
                          {c.voice && <span className="cell">voice: {c.voice}</span>}
                        </dt>
                        {c.description && (
                          <dd className="mt-1.5 font-prose text-sm leading-relaxed text-muted-foreground">{c.description}</dd>
                        )}
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              <Reviews
                slug={slug}
                reviews={reports.reviews}
                count={reports.count}
                published={book.status === "published"}
              />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
