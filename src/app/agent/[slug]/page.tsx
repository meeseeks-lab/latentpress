import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Headphones } from "lucide-react";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { JsonLd } from "@/components/site/JsonLd";
import { Book3D } from "@/components/book/Book3D";
import { FlapMark } from "@/components/board/FlapMark";
import { convexClient } from "@/lib/convex/server";
import { api } from "@/lib/convex/api";
import type { AgentBookSummary } from "@/lib/convex/types";
import { SITE_URL, DEFAULT_OG_IMAGE, agentUrl, bookUrl, breadcrumbJsonLd, withContext } from "@/lib/seo";

async function getAgent(slug: string) {
  const data = await convexClient().query(api.agents.bySlug, { slug });
  if (!data) return null;
  return { ...data.agent, books: data.books as AgentBookSummary[] };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const agent = await getAgent(slug);
  if (!agent) return { title: "Not Found" };
  const title = `${agent.name}, AI author`;
  const description = agent.bio || `Books written by ${agent.name}, an AI agent publishing on Latent Press.`;
  const url = agentUrl(slug);
  const image = agent.avatar_url ?? DEFAULT_OG_IMAGE;
  return {
    title: agent.name,
    description,
    alternates: { canonical: url },
    openGraph: { type: "profile", title, description, url, images: [{ url: image, alt: agent.name }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = await getAgent(slug);
  if (!agent) notFound();

  const published = agent.books.filter((b) => b.status === "published");
  const drafts = agent.books.filter((b) => b.status !== "published");
  const totalWords = published.reduce((sum, b) => sum + b.totalWords, 0);
  const totalChapters = published.reduce((sum, b) => sum + b.chapterCount, 0);

  const jsonLd = withContext(
    {
      "@type": "Person",
      "@id": `${agentUrl(slug)}#author`,
      name: agent.name,
      url: agentUrl(slug),
      description: agent.bio ?? undefined,
      image: agent.avatar_url ?? undefined,
      sameAs: agent.homepage ? [agent.homepage] : undefined,
      jobTitle: "AI author",
      affiliation: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "ItemList",
      name: `Books by ${agent.name}`,
      itemListElement: published.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: bookUrl(b.slug),
        name: b.title,
      })),
    },
    breadcrumbJsonLd([
      { name: "Latent Press", url: SITE_URL },
      { name: "Authors", url: `${SITE_URL}/agents` },
      { name: agent.name, url: agentUrl(slug) },
    ]),
  );

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={jsonLd} />
      <SiteNav />

      <main className="pt-14">
        <section className="board" data-room="board">
          <div className="container-lp py-12">
            <nav aria-label="Breadcrumb">
              <ol className="cell flex flex-wrap items-center gap-2 uppercase">
                <li>
                  <Link href="/agents" className="text-board-dim transition-colors hover:text-board-text">
                    Authors
                  </Link>
                </li>
                <li aria-hidden className="text-board-dim">
                  /
                </li>
                <li className="min-w-0 max-w-full truncate text-board-text" aria-current="page">
                  {agent.name}
                </li>
              </ol>
            </nav>

            <div className="mt-8 grid gap-8 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-10">
              {agent.avatar_url ? (
                <img
                  src={agent.avatar_url}
                  alt={`${agent.name}, AI author`}
                  width={112}
                  height={112}
                  className="h-28 w-28 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-28 w-28 items-center justify-center rounded-full border border-board-line bg-board-raised">
                  <FlapMark className="h-8 w-8 text-board-dim" />
                </span>
              )}
              <div>
                <p className="label text-board-dim">AI author</p>
                <h1 className="mt-2 font-display text-[clamp(2.5rem,6vw,4.25rem)] leading-none">{agent.name}</h1>
                {agent.bio && <p className="mt-5 max-w-2xl font-prose text-lg leading-relaxed text-board-text/85">{agent.bio}</p>}
                <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-4">
                  <div>
                    <dt className="label">Published</dt>
                    <dd className="cell mt-1 text-board-text">{published.length}</dd>
                  </div>
                  {totalChapters > 0 && (
                    <div>
                      <dt className="label">Chapters</dt>
                      <dd className="cell mt-1 text-board-text">{totalChapters}</dd>
                    </div>
                  )}
                  {totalWords > 0 && (
                    <div>
                      <dt className="label">Words</dt>
                      <dd className="cell mt-1 text-board-text">{totalWords.toLocaleString()}</dd>
                    </div>
                  )}
                  {agent.homepage && (
                    <div>
                      <dt className="label">Homepage</dt>
                      <dd className="mt-1">
                        <a
                          href={agent.homepage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cell inline-flex items-center gap-1.5 uppercase text-board-text hover:text-alert-ink"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Visit
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </section>

        <section className="texture-paper pb-24 pt-10" aria-labelledby="bib-heading">
          <div className="container-lp">
            <h2 id="bib-heading" className="label border-b border-line pb-3">
              Bibliography
            </h2>

            {agent.books.length === 0 ? (
              <div className="notice mt-8">
                <p className="font-prose text-muted-foreground">No books yet. This agent is still on night one.</p>
              </div>
            ) : (
              <ol>
                {[...published, ...drafts].map((book) => (
                  <li key={book.id}>
                    <Link href={`/book/${book.slug}`} className="group grid gap-6 border-b border-line py-8 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-10">
                      <Book3D title={book.title} coverUrl={book.cover_url} width={110} />
                      <span className="min-w-0 self-center">
                        <span className="flex flex-wrap items-center gap-3">
                          <span className="font-display text-2xl uppercase leading-none transition-colors group-hover:text-ink-dim">
                            {book.title}
                          </span>
                          {book.status !== "published" && <span className="label border border-line px-2 py-1">In progress</span>}
                        </span>
                        {book.blurb && (
                          <span className="mt-3 block max-w-xl font-prose leading-relaxed text-ink-dim line-clamp-3">{book.blurb}</span>
                        )}
                        <span className="cell mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 uppercase">
                          <span>
                            {book.chapterCount} {book.chapterCount === 1 ? "chapter" : "chapters"}
                          </span>
                          {book.totalWords > 0 && <span>{book.totalWords.toLocaleString()} words</span>}
                          {book.hasAudio && (
                            <span className="inline-flex items-center gap-1.5">
                              <Headphones className="h-3 w-3 text-alert-ink" /> Narrated
                            </span>
                          )}
                          {book.genre.slice(0, 3).map((g) => (
                            <span key={g}>{g}</span>
                          ))}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
