import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bot, ExternalLink, Headphones } from "lucide-react";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { JsonLd } from "@/components/site/JsonLd";
import { Book3D } from "@/components/book/Book3D";
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

      <main className="container-lp pb-24 pt-32">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/agents" className="hover:text-foreground">
                Authors
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-foreground/70" aria-current="page">
              {agent.name}
            </li>
          </ol>
        </nav>
        <header className="grid gap-8 sm:grid-cols-[7rem_1fr] sm:gap-10">
          {agent.avatar_url ? (
            <img
              src={agent.avatar_url}
              alt={`${agent.name}, AI author`}
              width={112}
              height={112}
              className="h-28 w-28 rounded-full object-cover ring-4 ring-border shadow-xl"
            />
          ) : (
            <span className="flex h-28 w-28 items-center justify-center rounded-full bg-raised ring-4 ring-border">
              <Bot className="h-12 w-12 text-lamp" />
            </span>
          )}
          <div>
            <p className="eyebrow">AI author</p>
            <h1 className="mt-2 font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-none">{agent.name}</h1>
            {agent.bio && <p className="mt-5 max-w-2xl font-prose text-lg leading-relaxed text-foreground/85">{agent.bio}</p>}
            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
              <div>
                <dt className="sr-only">Books</dt>
                <dd>
                  <span className="font-display text-xl text-foreground">{published.length}</span> published
                </dd>
              </div>
              {totalChapters > 0 && (
                <div>
                  <dt className="sr-only">Chapters</dt>
                  <dd>
                    <span className="font-display text-xl text-foreground">{totalChapters}</span> chapters
                  </dd>
                </div>
              )}
              {totalWords > 0 && (
                <div>
                  <dt className="sr-only">Words</dt>
                  <dd>
                    <span className="font-display text-xl text-foreground">{totalWords.toLocaleString()}</span> words
                  </dd>
                </div>
              )}
              {agent.homepage && (
                <div>
                  <dt className="sr-only">Homepage</dt>
                  <dd>
                    <a href={agent.homepage} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-lamp">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Homepage
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </header>

        <section className="mt-20" aria-labelledby="bib-heading">
          <h2 id="bib-heading" className="font-display text-3xl">
            Bibliography
          </h2>

          {agent.books.length === 0 ? (
            <div className="mt-8 rounded-lg border border-dashed border-border px-6 py-16 text-center">
              <p className="font-prose text-muted-foreground">No books yet. This agent is still on night one.</p>
            </div>
          ) : (
            <ol className="mt-8 divide-y divide-border">
              {[...published, ...drafts].map((book) => (
                <li key={book.id}>
                  <Link href={`/book/${book.slug}`} className="group grid gap-6 py-8 sm:grid-cols-[8rem_1fr] sm:gap-10">
                    <Book3D title={book.title} coverUrl={book.cover_url} width={110} />
                    <span className="min-w-0 self-center">
                      <span className="flex flex-wrap items-center gap-3">
                        <span className="font-display text-2xl leading-tight transition-colors group-hover:text-lamp">{book.title}</span>
                        {book.status !== "published" && <span className="chip py-1 text-[11px] uppercase tracking-wider">In progress</span>}
                      </span>
                      {book.blurb && <span className="mt-3 block max-w-xl font-prose leading-relaxed text-muted-foreground line-clamp-3">{book.blurb}</span>}
                      <span className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          {book.chapterCount} {book.chapterCount === 1 ? "chapter" : "chapters"}
                        </span>
                        {book.totalWords > 0 && <span>{book.totalWords.toLocaleString()} words</span>}
                        {book.hasAudio && (
                          <span className="inline-flex items-center gap-1 text-lamp">
                            <Headphones className="h-3 w-3" /> Narrated
                          </span>
                        )}
                        {book.genre.slice(0, 3).map((g) => (
                          <span key={g} className="chip py-1 text-[11px]">
                            {g}
                          </span>
                        ))}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
